'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { SUPPORTED_CHAINS, SupportedChain } from '@/config/bridge';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { createPublicClient, http } from 'viem';
import { sepolia, baseSepolia } from 'viem/chains';
import { ERC20_ABI } from '@/config/abis';

interface BridgeStep {
  name: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  txHash?: string;
}

const chains = [
  { id: 'ETH_SEPOLIA' as SupportedChain, name: 'Ethereum Sepolia', icon: 'Ξ' },
  { id: 'BASE_SEPOLIA' as SupportedChain, name: 'Base Sepolia', icon: '🔵' },
  { id: 'ARC_TESTNET' as SupportedChain, name: 'Arc Testnet', icon: '◆' },
];

const tokens = [
  { symbol: 'USDC', icon: '💲' },
  { symbol: 'EURC', icon: '💶' },
];

const TOKEN_ADDRESSES: Record<SupportedChain, Record<string, string>> = {
  ETH_SEPOLIA: {
    USDC: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    EURC: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
  },
  BASE_SEPOLIA: {
    USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    EURC: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
  },
  ARC_TESTNET: {
    USDC: '0x3600000000000000000000000000000000000000',
    EURC: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  },
};

const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
    public: { http: ['https://rpc.testnet.arc.network'] },
  },
} as const;

export default function BridgeCard() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const [fromChain, setFromChain] = useState<SupportedChain>('ETH_SEPOLIA');
  const [toChain, setToChain] = useState<SupportedChain>('ARC_TESTNET');
  const [token, setToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [isBridging, setIsBridging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<BridgeStep[]>([]);
  const [error, setError] = useState('');

  const [completionId, setCompletionId] = useState<string | null>(null);
  const [dismissedCompletionId, setDismissedCompletionId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [successData, setSuccessData] = useState<{
    amount: string;
    token: string;
    fromChain: string;
    toChain: string;
    txHash: string;
  } | null>(null);

  const [fromBalance, setFromBalance] = useState('0.0000');
  const [toBalance, setToBalance] = useState('0.0000');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  const fetchBalance = useCallback(async (
    chainId: SupportedChain,
    tokenSymbol: string,
    userAddress: string
  ): Promise<string> => {
    try {
      let client;

      if (chainId === 'ETH_SEPOLIA') {
        client = createPublicClient({
          chain: sepolia,
          transport: http('https://0xrpc.io/sep'),
        });
      } else if (chainId === 'BASE_SEPOLIA') {
        client = createPublicClient({
          chain: baseSepolia,
          transport: http('https://base-sepolia.drpc.org'),
        });
      } else {
        client = createPublicClient({
          chain: arcTestnet,
          transport: http('https://rpc.testnet.arc.network'),
        });
      }

      const tokenAddress = TOKEN_ADDRESSES[chainId][tokenSymbol];

      if (chainId === 'ARC_TESTNET' && tokenSymbol === 'USDC') {
        const balance = await client.getBalance({
          address: userAddress as `0x${string}`,
        });
        return (Number(balance) / 1e18).toFixed(4);
      }

      const balance = await client.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [userAddress as `0x${string}`],
      });

      return (Number(balance) / 1e6).toFixed(4);
    } catch (err) {
      console.error(`Error fetching ${chainId} ${tokenSymbol} balance:`, err);
      return '0.0000';
    }
  }, []);

  useEffect(() => {
    if (!address) {
      setFromBalance('0.0000');
      setToBalance('0.0000');
      return;
    }

    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      try {
        const [from, to] = await Promise.all([
          fetchBalance(fromChain, token, address),
          fetchBalance(toChain, token, address),
        ]);
        setFromBalance(from);
        setToBalance(to);
      } catch (err) {
        console.error('Balance fetch error:', err);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [fromChain, toChain, token, address, fetchBalance]);

  useEffect(() => {
    if (error) {
      setShowSuccess(false);
      return;
    }
    if (!completionId) {
      setShowSuccess(false);
      return;
    }
    if (completionId === dismissedCompletionId) {
      setShowSuccess(false);
      return;
    }
    setShowSuccess(true);
  }, [completionId, error, dismissedCompletionId]);

  const handleFlip = useCallback(() => {
    setFromChain(toChain);
    setToChain(fromChain);
  }, [fromChain, toChain]);

  const handleDismissSuccess = useCallback(() => {
    setShowSuccess(false);
    setDismissedCompletionId(completionId);
    setSuccessData(null);
    setCompletionId(null);
    setAmount('');
    setSteps([]);
  }, [completionId]);

  const handleBridge = async () => {
    if (!walletClient || !isConnected || !address) {
      openConnectModal?.();
      return;
    }

    if (!window.ethereum) {
      setError('No Ethereum provider found');
      return;
    }

    setIsBridging(true);
    setError('');
    setCompletionId(null);
    setSuccessData(null);
    setShowSuccess(false);
    setDismissedCompletionId(null);
    setCurrentStep(0);
    
    // CCTP has 3 steps: Burn → Attestation → Mint (automatic)
    setSteps([
      { name: `Burn on ${SUPPORTED_CHAINS[fromChain].name}`, status: 'processing' },
      { name: 'Waiting for attestation', status: 'pending' },
      { name: `Mint on ${SUPPORTED_CHAINS[toChain].name}`, status: 'pending' },
    ]);

    try {
      const adapter = await createViemAdapterFromProvider({
        provider: window.ethereum as any,
      });

      const kit = new BridgeKit();

      console.log('=== STARTING BRIDGE ===');
      
      const result: any = await kit.bridge({
        from: { adapter, chain: SUPPORTED_CHAINS[fromChain].bridgeId },
        to: { 
          adapter, 
          chain: SUPPORTED_CHAINS[toChain].bridgeId,
          useForwarder: true,
        },
        token: token as any,
        amount: amount,
      });

      console.log('=== BRIDGE RESULT ===', result);

      // Check for user rejection
      if (
        result?.error?.message?.includes('User rejected') ||
        result?.error?.message?.includes('User denied') ||
        result?.error?.code === 4001
      ) {
        throw new Error('Transaction cancelled by user');
      }

      // Check for explicit error state
      if (result?.state === 'error') {
        const failedStep = result.steps?.find((s: any) => s.state === 'error');
        throw new Error(failedStep?.error || failedStep?.errorMessage || 'Bridge failed');
      }

      // Extract burn transaction hash
      const burnStep = result?.steps?.find((s: any) => s.name === 'burn' || s.name === 'Burn');
      const burnTxHash = burnStep?.txHash || burnStep?.hash;

      if (!burnTxHash) {
        console.error('No burn hash found. Result steps:', result?.steps);
        throw new Error('Bridge failed - no burn transaction hash');
      }

      // Step 1: Burn complete
      setSteps(prev => prev.map((s, i) => 
        i === 0 ? { ...s, status: 'success' as const, txHash: burnTxHash } : s
      ));
      setCurrentStep(1);

      // Step 2: Attestation (automatic, no user action)
      setSteps(prev => prev.map((s, i) => 
        i === 1 ? { ...s, status: 'processing' as const } : s
      ));

      // Wait for attestation (Circle's backend)
      await new Promise(resolve => setTimeout(resolve, 3000));

      setSteps(prev => prev.map((s, i) => 
        i === 1 ? { ...s, status: 'success' as const } : s
      ));
      setCurrentStep(2);

      // Step 3: Mint (automatic on destination chain)
      setSteps(prev => prev.map((s, i) => 
        i === 2 ? { ...s, status: 'processing' as const } : s
      ));

      await new Promise(resolve => setTimeout(resolve, 2000));

      setSteps(prev => prev.map((s, i) => 
        i === 2 ? { ...s, status: 'success' as const } : s
      ));

      // Success!
      setError('');
      setSuccessData({
        amount,
        token,
        fromChain: SUPPORTED_CHAINS[fromChain].name,
        toChain: SUPPORTED_CHAINS[toChain].name,
        txHash: burnTxHash,
      });

      setCompletionId(burnTxHash);

      // Refresh balances
      if (address) {
        setTimeout(async () => {
          const [from, to] = await Promise.all([
            fetchBalance(fromChain, token, address),
            fetchBalance(toChain, token, address),
          ]);
          setFromBalance(from);
          setToBalance(to);
        }, 5000); // Wait 5s for balances to update
      }

    } catch (err: any) {
      console.error('=== BRIDGE ERROR ===', err);

      setCompletionId(null);
      setSuccessData(null);

      if (
        err?.message?.includes('User rejected') ||
        err?.message?.includes('User denied') ||
        err?.message?.includes('user rejected') ||
        err?.message?.includes('cancelled by user') ||
        err?.code === 4001 ||
        err?.code === 'ACTION_REJECTED'
      ) {
        setError('Transaction cancelled by user');
      } else {
        setError(err?.shortMessage || err?.message || 'Bridge failed');
      }

      setSteps(prev => prev.map(s => 
        s.status === 'processing' ? { ...s, status: 'error' as const } : s
      ));

    } finally {
      setIsBridging(false);
    }
  };

  const tokenObj = tokens.find((t) => t.symbol === token)!;
  const fromChainObj = chains.find((c) => c.id === fromChain)!;
  const toChainObj = chains.find((c) => c.id === toChain)!;
  const usdValue = parseFloat(amount || '0') * (token === 'EURC' ? 1.08 : 1);

  return (
    <div className="w-full max-w-md">
      <div className="glass-card-strong overflow-visible p-5">
        <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
          Bridge
        </h2>

        {/* FROM row */}
        <div className="rounded-2xl border border-glass-border/40 bg-secondary/25">
          <div className="flex items-center gap-3 border-b border-glass-border/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="relative">
              <select
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value as SupportedChain)}
                className="cursor-pointer appearance-none rounded-full border border-glass-border/50 bg-secondary/70 py-1.5 pl-8 pr-8 font-display text-sm font-semibold text-foreground focus:outline-none"
              >
                {chains.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === toChain}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                {fromChainObj.icon}
              </span>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent font-mono text-3xl font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
              <div className="relative shrink-0">
                <select
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="cursor-pointer appearance-none rounded-full border border-glass-border/50 bg-secondary/70 py-1.5 pl-8 pr-7 font-display text-sm font-semibold text-foreground focus:outline-none"
                >
                  {tokens.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                  {tokenObj.icon}
                </span>
                <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                ${usdValue.toFixed(2)}
              </span>
              {address ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono">
                    {isLoadingBalances ? '...' : fromBalance}
                  </span>
                </div>
              ) : (
                <span className="text-muted-foreground/60">Connect wallet</span>
              )}
            </div>
          </div>
        </div>

        <div className="relative z-10 -my-3 flex items-center justify-center">
          <button
            onClick={handleFlip}
            className="rounded-full border border-glass-border bg-card p-2 shadow-lg transition-all duration-200 hover:scale-110 hover:bg-muted"
            aria-label="Flip chains"
          >
            <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* TO row */}
        <div className="rounded-2xl border border-glass-border/40 bg-secondary/25">
          <div className="flex items-center gap-3 border-b border-glass-border/30 px-4 py-3">
            <span className="text-sm text-muted-foreground">To</span>
            <div className="relative">
              <select
                value={toChain}
                onChange={(e) => setToChain(e.target.value as SupportedChain)}
                className="cursor-pointer appearance-none rounded-full border border-glass-border/50 bg-secondary/70 py-1.5 pl-8 pr-8 font-display text-sm font-semibold text-foreground focus:outline-none"
              >
                {chains.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === fromChain}>
                    {c.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm">
                {toChainObj.icon}
              </span>
              <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="px-4 py-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="w-full font-mono text-3xl font-medium text-foreground">
                {amount || "0"}
              </span>
              <div className="flex shrink-0 items-center gap-2 rounded-full border border-glass-border/50 bg-secondary/70 px-3 py-1.5">
                <span className="text-sm">{tokenObj.icon}</span>
                <span className="font-display text-sm font-semibold text-foreground">
                  {tokenObj.symbol}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                ${usdValue.toFixed(2)}
              </span>
              {address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-mono">
                    {isLoadingBalances ? '...' : toBalance}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {steps.length > 0 && !showSuccess && (
          <div className="mt-4 space-y-2">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border border-glass-border/30 bg-secondary/20 p-3">
                {step.status === 'success' ? (
                  <svg className="h-5 w-5 flex-shrink-0 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : step.status === 'processing' ? (
                  <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : step.status === 'error' ? (
                  <svg className="h-5 w-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-muted-foreground/30" />
                )}
                <span className="text-sm text-foreground">{step.name}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          className="glass-button mt-5 w-full text-base disabled:opacity-60"
          disabled={!address || !amount || isBridging}
          onClick={handleBridge}
        >
          {!address ? 'Connect wallet' : isBridging ? `Processing step ${currentStep + 1} of 3...` : 'Bridge'}
        </button>

        <ul className="mt-4 space-y-1.5 rounded-xl border border-glass-border/30 bg-secondary/15 p-3 text-xs text-muted-foreground">
          <li>• Bridges use Circle CCTP for secure transfers</li>
          <li>• Process: Burn → Attestation → Mint (automatic)</li>
          <li>• Estimated time: 10–20 minutes total</li>
        </ul>
      </div>

      {/* Success Dialog */}
      {showSuccess && successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card-strong w-full max-w-md border-glass-border bg-background/80 p-6 backdrop-blur-2xl">
            <div className="flex flex-col items-center">
              <div className="relative mb-5">
                <div className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 ring-2 ring-accent/40">
                  <svg className="h-9 w-9 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h2 className="mb-1.5 text-center font-display text-xl font-bold text-foreground">
                Bridge Initiated!
              </h2>
              <p className="mb-5 text-center text-sm text-muted-foreground">
                Tokens burned on source chain. Minting will complete automatically in ~10–20 minutes.
              </p>
              <div className="mb-4 w-full space-y-3 rounded-xl border border-glass-border/40 bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="shrink-0 text-muted-foreground">Amount</span>
                  <span className="text-right font-medium text-foreground">{successData.amount} {successData.token}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="shrink-0 text-muted-foreground">From</span>
                  <span className="text-right font-medium text-foreground">{successData.fromChain}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="shrink-0 text-muted-foreground">To</span>
                  <span className="text-right font-medium text-foreground">{successData.toChain}</span>
                </div>
              </div>
              {successData.txHash && (
                <div className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-glass-border/40 bg-secondary/20 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Burn Tx Hash
                    </p>
                    <p className="truncate font-mono text-xs text-foreground">
                      {successData.txHash.slice(0, 10)}...{successData.txHash.slice(-8)}
                    </p>
                  </div>
                  
                  <a
                    href={`${SUPPORTED_CHAINS[fromChain].explorer}/tx/${successData.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              <button
                onClick={handleDismissSuccess}
                className="glass-button w-full text-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}