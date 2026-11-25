import { Networks } from "@stellar/stellar-sdk";

export type NetworkName = "testnet" | "mainnet" | "futurenet";

export interface NetworkInfo {
  name: NetworkName;
  passphrase: string;
  rpcUrl: string;
  explorerUrl: string;
}

export const NETWORKS: Record<NetworkName, NetworkInfo> = {
  testnet: {
    name: "testnet",
    passphrase: Networks.TESTNET,
    rpcUrl: "https://soroban-testnet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
  mainnet: {
    name: "mainnet",
    passphrase: Networks.PUBLIC,
    // There is no public SDF mainnet RPC; operators must supply their own.
    rpcUrl: "",
    explorerUrl: "https://stellar.expert/explorer/public",
  },
  futurenet: {
    name: "futurenet",
    passphrase: Networks.FUTURENET,
    rpcUrl: "https://rpc-futurenet.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/futurenet",
  },
};

export function getNetwork(name: string | undefined): NetworkInfo {
  if (name && name in NETWORKS) return NETWORKS[name as NetworkName];
  return NETWORKS.testnet;
}

export function explorerTxUrl(network: NetworkInfo, hash: string): string {
  return `${network.explorerUrl}/tx/${hash}`;
}

export function explorerAccountUrl(network: NetworkInfo, address: string): string {
  const kind = address.startsWith("C") ? "contract" : "account";
  return `${network.explorerUrl}/${kind}/${address}`;
}
