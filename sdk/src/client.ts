import {
  Account,
  BASE_FEE,
  Contract,
  Keypair,
  TransactionBuilder,
  rpc,
  scValToNative,
  xdr,
} from "@stellar/stellar-sdk";
import * as args from "./args";
import { decodePlan, decodeSubscription } from "./decode";
import { CONTRACT_ERRORS, contractErrorCode, type ContractErrorCode } from "./errors";
import type { CreatePlanParams, LumenSubConfig, Plan, Subscription } from "./types";

/** Ledger close time used to turn billing periods into ledger counts. */
const SECONDS_PER_LEDGER = 5;
/** Kept just under the network's maximum entry TTL of 3,110,400 ledgers. */
const MAX_APPROVAL_LEDGERS = 3_100_000;

export interface SubmitResult {
  hash: string;
  /** Decoded return value of the contract call, when there is one. */
  returnValue?: unknown;
}

export class LumenSubError extends Error {
  constructor(
    message: string,
    readonly detail?: unknown,
    /** Set when the contract itself rejected the call. See CONTRACT_ERRORS. */
    readonly code?: ContractErrorCode,
  ) {
    super(message);
    this.name = "LumenSubError";
  }
}

/** Turns a failed simulation into a LumenSubError, with a readable message for contract errors. */
function simulationError(method: string, raw: string, detail: unknown): LumenSubError {
  const code = contractErrorCode(raw);
  return code
    ? new LumenSubError(CONTRACT_ERRORS[code].message, detail, code)
    : new LumenSubError(`${method} failed: ${raw}`, detail);
}

/**
 * Builds unsigned transactions for the subscription contract and reads its
 * state. Signing is left to the caller (Freighter, a hardware wallet, a
 * server-side keypair) so the SDK never touches secret keys.
 */
export class LumenSubClient {
  readonly server: rpc.Server;
  private readonly contract: Contract;

  constructor(private readonly config: LumenSubConfig) {
    if (!config.rpcUrl) throw new LumenSubError("rpcUrl is required");
    if (!config.contractId) throw new LumenSubError("contractId is required");
    this.server = new rpc.Server(config.rpcUrl, { allowHttp: config.rpcUrl.startsWith("http://") });
    this.contract = new Contract(config.contractId);
  }

  get contractId(): string {
    return this.config.contractId;
  }

  // ---- write calls -------------------------------------------------------

  buildCreatePlan(merchant: string, params: CreatePlanParams): Promise<string> {
    return this.build(merchant, "create_plan", args.createPlanArgs(merchant, params));
  }

  buildSetPlanActive(merchant: string, planId: bigint, active: boolean): Promise<string> {
    return this.build(merchant, "set_plan_active", args.setPlanActiveArgs(merchant, planId, active));
  }

  buildSubscribe(subscriber: string, planId: bigint): Promise<string> {
    return this.build(subscriber, "subscribe", args.subscribeArgs(subscriber, planId));
  }

  buildPause(subscriber: string, subId: bigint): Promise<string> {
    return this.build(subscriber, "pause", args.subscriberActionArgs(subscriber, subId));
  }

  buildResume(subscriber: string, subId: bigint): Promise<string> {
    return this.build(subscriber, "resume", args.subscriberActionArgs(subscriber, subId));
  }

  /** Either the subscriber or the plan's merchant may cancel. */
  buildCancel(caller: string, subId: bigint): Promise<string> {
    return this.build(caller, "cancel", args.subscriberActionArgs(caller, subId));
  }

  buildChangePlan(subscriber: string, subId: bigint, newPlanId: bigint): Promise<string> {
    return this.build(subscriber, "change_plan", args.changePlanArgs(subscriber, subId, newPlanId));
  }

  buildCharge(keeper: string, subId: bigint): Promise<string> {
    return this.build(keeper, "charge", args.chargeArgs(keeper, subId));
  }

  buildRefund(merchant: string, subId: bigint, amount: bigint): Promise<string> {
    return this.build(merchant, "refund", args.refundArgs(merchant, subId, amount));
  }

  /**
   * Let the subscription contract pull `amount` of `token` from `from` until
   * `expirationLedger`. This has to happen before `subscribe`.
   */
  buildApprove(token: string, from: string, amount: bigint, expirationLedger: number): Promise<string> {
    return this.build(from, "approve", args.approveArgs(from, this.contractId, amount, expirationLedger), token);
  }

  /**
   * Pick an expiration ledger that covers `cycles` billing periods, capped at
   * what the network allows. Subscribers can top the approval up later.
   */
  async approvalExpirationLedger(periodSecs: bigint, cycles: number): Promise<number> {
    const { sequence } = await this.server.getLatestLedger();
    const wanted = Math.ceil((Number(periodSecs) * Math.max(cycles, 1)) / SECONDS_PER_LEDGER);
    return sequence + Math.min(wanted, MAX_APPROVAL_LEDGERS);
  }

  // ---- reads -------------------------------------------------------------

  async getPlan(planId: bigint): Promise<Plan> {
    return decodePlan(planId, await this.read("get_plan", [args.u64(planId)]));
  }

  async getSubscription(subId: bigint): Promise<Subscription> {
    return decodeSubscription(subId, await this.read("get_subscription", [args.u64(subId)]));
  }

  async isDue(subId: bigint): Promise<boolean> {
    return Boolean(scValToNative(await this.read("is_due", [args.u64(subId)])));
  }

  /** A merchant's payout address, plan count and registration time. */
  async getMerchant(merchant: string): Promise<{ payout: string; planCount: number; registeredAt: bigint }> {
    const raw = scValToNative(await this.read("get_merchant", [args.address(merchant)])) as Record<string, unknown>;
    return {
      payout: String(raw.payout),
      planCount: Number(raw.plan_count ?? 0),
      registeredAt: BigInt((raw.registered_at as bigint | number | undefined) ?? 0),
    };
  }

  /** Number of plans ever created. Plan ids run from 1 to this number. */
  async planCount(): Promise<bigint> {
    return BigInt(scValToNative(await this.read("plan_count", [])) as bigint);
  }

  /** Number of subscriptions ever created. Subscription ids run from 1 to this number. */
  async subscriptionCount(): Promise<bigint> {
    return BigInt(scValToNative(await this.read("subscription_count", [])) as bigint);
  }

  async getConfig(): Promise<Record<string, unknown>> {
    return scValToNative(await this.read("get_config", [])) as Record<string, unknown>;
  }

  // ---- submission --------------------------------------------------------

  /** Send a signed transaction and wait until it lands or fails. */
  async submit(signedXdr: string, timeoutMs = 30_000): Promise<SubmitResult> {
    const tx = TransactionBuilder.fromXDR(signedXdr, this.config.networkPassphrase);
    const sent = await this.server.sendTransaction(tx);
    if (sent.status === "ERROR" || sent.status === "TRY_AGAIN_LATER") {
      throw new LumenSubError(`Transaction was rejected (${sent.status})`, sent.errorResult);
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const result = await this.server.getTransaction(sent.hash);
      if (result.status === rpc.Api.GetTransactionStatus.SUCCESS) {
        return {
          hash: sent.hash,
          returnValue: result.returnValue ? scValToNative(result.returnValue) : undefined,
        };
      }
      if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new LumenSubError("Transaction failed on chain", result.resultXdr);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw new LumenSubError(`Timed out waiting for transaction ${sent.hash}`);
  }

  // ---- internals ---------------------------------------------------------

  private async build(
    source: string,
    method: string,
    callArgs: xdr.ScVal[],
    contractId = this.config.contractId,
  ): Promise<string> {
    const account = await this.server.getAccount(source);
    const contract = contractId === this.config.contractId ? this.contract : new Contract(contractId);
    const tx = new TransactionBuilder(account, {
      fee: this.config.baseFee ?? BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(contract.call(method, ...callArgs))
      .setTimeout(this.config.timeoutSecs ?? 300)
      .build();

    try {
      const prepared = await this.server.prepareTransaction(tx);
      return prepared.toXDR();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      throw simulationError(method, raw, err);
    }
  }

  /**
   * Run a read-only call through simulation. The source account doesn't need
   * to exist on chain for simulation, so a throwaway key is fine.
   */
  private async read(method: string, callArgs: xdr.ScVal[]): Promise<xdr.ScVal> {
    const source = new Account(Keypair.random().publicKey(), "0");
    const tx = new TransactionBuilder(source, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(this.contract.call(method, ...callArgs))
      .setTimeout(30)
      .build();

    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) {
      throw simulationError(method, sim.error, sim);
    }
    if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
      throw new LumenSubError(`${method} returned no result`, sim);
    }
    return sim.result.retval;
  }
}
