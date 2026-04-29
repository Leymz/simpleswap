export const SUPPORTED_CHAINS = {
  ARC_TESTNET: {
    id: 5042002,
    name: 'Arc Testnet',
    bridgeId: 'Arc_Testnet',
    rpc: 'https://rpc.testnet.arc.network',
    explorer: 'https://testnet.arcscan.app',
    nativeToken: 'USDC',
  },
  ETH_SEPOLIA: {
    id: 11155111,
    name: 'Ethereum Sepolia',
    bridgeId: 'Ethereum_Sepolia',
    rpc: 'https://0xrpc.io/sep',
    explorer: 'https://sepolia.etherscan.io',
    nativeToken: 'ETH',
  },
  BASE_SEPOLIA: {
    id: 84532,
    name: 'Base Sepolia',
    bridgeId: 'Base_Sepolia',
    rpc: 'https://base-sepolia.drpc.org',
    explorer: 'https://sepolia.basescan.org',
    nativeToken: 'ETH',
  },
} as const;

export type SupportedChain = keyof typeof SUPPORTED_CHAINS;

export const BRIDGE_ROUTES = [
  { from: 'ETH_SEPOLIA', to: 'ARC_TESTNET' },
  { from: 'BASE_SEPOLIA', to: 'ARC_TESTNET' },
  { from: 'ARC_TESTNET', to: 'ETH_SEPOLIA' },
  { from: 'ARC_TESTNET', to: 'BASE_SEPOLIA' },
] as const;