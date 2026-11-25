/**
 * Freighter wrapper. The extension API is loaded lazily so it never runs
 * during server rendering, and every call is normalised to either a value
 * or a thrown WalletError with a message a person can act on.
 */

export class WalletError extends Error {
  constructor(
    message: string,
    readonly code: "not_installed" | "rejected" | "wrong_network" | "unknown" = "unknown",
  ) {
    super(message);
    this.name = "WalletError";
  }
}

type FreighterError = { message?: string; code?: number } | undefined;

async function freighter() {
  return import("@stellar/freighter-api");
}

function check(error: FreighterError, fallback: string): void {
  if (!error) return;
  const message = error.message ?? fallback;
  const rejected = /reject|declin|denied/i.test(message);
  throw new WalletError(rejected ? "The request was declined in Freighter." : message, rejected ? "rejected" : "unknown");
}

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const { isConnected } = await freighter();
    const result = await isConnected();
    return Boolean(result.isConnected);
  } catch {
    return false;
  }
}

/** Ask Freighter for access and return the selected public key. */
export async function connectFreighter(): Promise<string> {
  if (!(await isFreighterInstalled())) {
    throw new WalletError("Freighter isn't installed in this browser.", "not_installed");
  }
  const { requestAccess } = await freighter();
  const result = await requestAccess();
  check(result.error, "Couldn't connect to Freighter.");
  if (!result.address) throw new WalletError("Freighter didn't return an address.");
  return result.address;
}

/** Return the address if this site is already allowed, without prompting. */
export async function getConnectedAddress(): Promise<string | null> {
  try {
    const { isAllowed, getAddress } = await freighter();
    const allowed = await isAllowed();
    if (!allowed.isAllowed) return null;
    const result = await getAddress();
    return result.address || null;
  } catch {
    return null;
  }
}

/** Make sure Freighter is pointed at the network this app is configured for. */
export async function assertNetwork(expectedPassphrase: string): Promise<void> {
  const { getNetworkDetails } = await freighter();
  const details = await getNetworkDetails();
  check(details.error, "Couldn't read Freighter's network.");
  if (details.networkPassphrase !== expectedPassphrase) {
    throw new WalletError(
      `Freighter is set to ${details.network}. Switch it to the network this app uses and try again.`,
      "wrong_network",
    );
  }
}

export async function signWithFreighter(xdr: string, address: string, networkPassphrase: string): Promise<string> {
  const { signTransaction } = await freighter();
  const result = await signTransaction(xdr, { address, networkPassphrase });
  check(result.error, "Freighter couldn't sign the transaction.");
  return result.signedTxXdr;
}
