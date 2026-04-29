import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define Arc Testnet
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Simple Swap',
  projectId: '5fd0a0193a78077301789d54d874c9c4',
  chains: [arcTestnet],
  ssr: true,
});

// Contract addresses
export const CONTRACTS = {
  // SimpleDEX - Your deployed contract for liquidity provision
  simpleDex: '0xB0a5D6ac1f5de0de293d4AF057303E32A7Eef9a0',
  
  // Curve StableSwap Pool on Arc Testnet (USDC/EURC)
  curvePool: '0xFF5Cb29241F002fFeD2eAa224e3e996D24A6E8d1',
  
  // Official Arc Testnet Tokens
  usdc: '0x3600000000000000000000000000000000000000',
  eurc: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
};

// Explorer URL helper
export const getExplorerUrl = (hash: string, type: 'tx' | 'address' = 'tx') => {
  return `https://testnet.arcscan.app/${type}/${hash}`;
};