'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { CONTRACTS } from '@/config/wagmi';
import { TOKENS } from '@/config/tokens';
import { ERC20_ABI, SIMPLE_DEX_ABI } from '@/config/abis';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export default function LiquidityCard() {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { openConnectModal } = useConnectModal();

  const [reserves, setReserves] = useState({ usdc: BigInt(0), eurc: BigInt(0) });
  const [totalLiquidity, setTotalLiquidity] = useState(BigInt(0));
  const [userLiquidity, setUserLiquidity] = useState(BigInt(0));
  const [usdcAmount, setUsdcAmount] = useState('');
  const [eurcAmount, setEurcAmount] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [slippage, setSlippage] = useState(0.5);
  const [isApproving, setIsApproving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [txHash, setTxHash] = useState<string | null>(null);
  const [dismissedTxHash, setDismissedTxHash] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'add' | 'remove';
    usdcAmount: string;
    eurcAmount: string;
    txHash: string;
  } | null>(null);
  
  const [usdcAllowance, setUsdcAllowance] = useState(BigInt(0));
  const [eurcAllowance, setEurcAllowance] = useState(BigInt(0));

  const { balance: usdcBalance, refetch: refetchUsdc } = useTokenBalance(TOKENS.USDC);
  const { balance: eurcBalance, refetch: refetchEurc } = useTokenBalance(TOKENS.EURC);

  const fetchPoolData = useCallback(async () => {
    if (!publicClient) return;
    try {
      const [reserveUSDC, reserveEURC, totalLiq] = await Promise.all([
        publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'reserveUSDC',
        }),
        publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'reserveEURC',
        }),
        publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'totalLiquidity',
        }),
      ]);
      setReserves({ usdc: reserveUSDC as bigint, eurc: reserveEURC as bigint });
      setTotalLiquidity(totalLiq as bigint);
      if (userAddress) {
        const userLiq = await publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'liquidityBalance',
          args: [userAddress],
        });
        setUserLiquidity(userLiq as bigint);
      }
    } catch (err) {
      console.error('Error fetching pool data:', err);
    }
  }, [publicClient, userAddress]);

  const fetchAllowances = useCallback(async () => {
    if (!publicClient || !userAddress) return;
    try {
      const [usdcAllow, eurcAllow] = await Promise.all([
        publicClient.readContract({
          address: TOKENS.USDC.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
        }),
        publicClient.readContract({
          address: TOKENS.EURC.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
        }),
      ]);
      setUsdcAllowance(usdcAllow as bigint);
      setEurcAllowance(eurcAllow as bigint);
    } catch (err) {
      console.error('Error fetching allowances:', err);
    }
  }, [publicClient, userAddress]);

  useEffect(() => {
    fetchPoolData();
    fetchAllowances();
    const interval = setInterval(fetchPoolData, 10000);
    return () => clearInterval(interval);
  }, [fetchPoolData, fetchAllowances]);

  useEffect(() => {
    if (!txHash || error) {
      setShowSuccess(false);
      return;
    }
    if (txHash === dismissedTxHash) {
      setShowSuccess(false);
      return;
    }
    setShowSuccess(true);
  }, [txHash, error, dismissedTxHash]);

  const handleDismissSuccess = useCallback(() => {
    setShowSuccess(false);
    setDismissedTxHash(txHash);
    setUsdcAmount('');
    setEurcAmount('');
    setRemoveAmount('');
    setTimeout(() => setTxHash(null), 300);
  }, [txHash]);

  const handleUsdcChange = (val: string) => {
    setUsdcAmount(val);
  };

  const handleEurcChange = (val: string) => {
    setEurcAmount(val);
  };

  const usdcAmountWei = usdcAmount ? parseUnits(usdcAmount, 6) : BigInt(0);
  const eurcAmountWei = eurcAmount ? parseUnits(eurcAmount, 6) : BigInt(0);
  const needsUsdcApproval = usdcAmountWei > BigInt(0) && usdcAllowance < usdcAmountWei;
  const needsEurcApproval = eurcAmountWei > BigInt(0) && eurcAllowance < eurcAmountWei;

  const approveToken = async (token: 'USDC' | 'EURC') => {
    if (!walletClient || !userAddress) return;
    setIsApproving(true);
    setError(null);
    try {
      const tokenAddress = token === 'USDC' ? TOKENS.USDC.address : TOKENS.EURC.address;
      const hash = await walletClient.writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.simpleDex as `0x${string}`, maxUint256],
      });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        await fetchAllowances();
      }
    } catch (err: any) {
      setError(err.shortMessage || err.message || 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  const addLiquidity = async () => {
    if (!walletClient || !publicClient || !userAddress) return;
    if (!usdcAmount || !eurcAmount) return;
    setIsProcessing(true);
    setError(null);
    setTxHash(null);
    setSuccessData(null);
    try {
      if (needsUsdcApproval) await approveToken('USDC');
      if (needsEurcApproval) await approveToken('EURC');
      let minLiquidity = BigInt(0);
      try {
        const quote = await publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'getAddLiquidityQuote',
          args: [usdcAmountWei, eurcAmountWei],
        });
        minLiquidity = (quote as bigint) * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      } catch (err) {
        minLiquidity = BigInt(0);
      }
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.simpleDex as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName: 'addLiquidity',
        args: [usdcAmountWei, eurcAmountWei, minLiquidity, deadline],
      });
      setTxHash(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        setError('Transaction failed. Please check your balances and try again.');
        setTxHash(null);
        setIsProcessing(false);
        return;
      }
      
      setSuccessData({
        type: 'add',
        usdcAmount,
        eurcAmount,
        txHash: hash,
      });
      
      await fetchPoolData();
      await fetchAllowances();
      refetchUsdc();
      refetchEurc();
    } catch (err: any) {
      console.error('Add liquidity error:', err);
      let errorMsg = err.shortMessage || err.message || 'Failed to add liquidity';
      if (errorMsg.includes('Slippage') || errorMsg.includes('slippage')) {
        errorMsg = 'Slippage tolerance exceeded. Try increasing slippage or adjusting amounts.';
      } else if (errorMsg.includes('expired') || errorMsg.includes('Deadline')) {
        errorMsg = 'Transaction deadline expired. Please try again.';
      }
      setError(errorMsg);
      setTxHash(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeLiquidity = async () => {
    if (!walletClient || !publicClient || !userAddress) return;
    if (!removeAmount) return;
    setIsProcessing(true);
    setError(null);
    setTxHash(null);
    setSuccessData(null);
    try {
      const liquidityToRemove = parseUnits(removeAmount, 6);
      let minUsdcOut = BigInt(0);
      let minEurcOut = BigInt(0);
      try {
        const quote = await publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'getRemoveLiquidityQuote',
          args: [liquidityToRemove],
        });
        const [usdcOut, eurcOut] = quote as [bigint, bigint];
        minUsdcOut = usdcOut * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
        minEurcOut = eurcOut * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      } catch (err) {
        minUsdcOut = BigInt(0);
        minEurcOut = BigInt(0);
      }
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const hash = await walletClient.writeContract({
        address: CONTRACTS.simpleDex as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName: 'removeLiquidity',
        args: [liquidityToRemove, minUsdcOut, minEurcOut, deadline],
      });
      setTxHash(hash);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status === 'reverted') {
        setError('Transaction failed. Please check your LP balance and try again.');
        setTxHash(null);
        setIsProcessing(false);
        return;
      }
      
      setSuccessData({
        type: 'remove',
        usdcAmount: parseFloat(formatUnits(minUsdcOut, 6)).toFixed(6),
        eurcAmount: parseFloat(formatUnits(minEurcOut, 6)).toFixed(6),
        txHash: hash,
      });
      
      await fetchPoolData();
      refetchUsdc();
      refetchEurc();
    } catch (err: any) {
      console.error('Remove liquidity error:', err);
      let errorMsg = err.shortMessage || err.message || 'Failed to remove liquidity';
      if (errorMsg.includes('Slippage') || errorMsg.includes('slippage')) {
        errorMsg = 'Slippage tolerance exceeded. Try increasing slippage or waiting for better conditions.';
      } else if (errorMsg.includes('expired') || errorMsg.includes('Deadline')) {
        errorMsg = 'Transaction deadline expired. Please try again.';
      }
      setError(errorMsg);
      setTxHash(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (value: bigint, decimals: number = 6) => {
    const formatted = formatUnits(value, decimals);
    return parseFloat(formatted).toFixed(4);
  };

  // CALCULATE REAL POOL SHARE
  const calculatePoolShare = () => {
    if (!usdcAmount || !eurcAmount || totalLiquidity === BigInt(0)) return '0.00';
    
    try {
      const usdcWei = parseUnits(usdcAmount, 6);
      const eurcWei = parseUnits(eurcAmount, 6);
      
      // Estimate LP tokens (simplified - assumes balanced deposit)
      const estimatedLP = (usdcWei + eurcWei) / BigInt(2);
      const newTotal = totalLiquidity + estimatedLP;
      const share = (Number(estimatedLP) / Number(newTotal)) * 100;
      
      return share.toFixed(4);
    } catch {
      return '0.00';
    }
  };

  // CALCULATE LP TOKENS TO BE RECEIVED
  const calculateLPTokens = () => {
    if (!usdcAmount || !eurcAmount) return '—';
    
    try {
      const usdcWei = parseUnits(usdcAmount, 6);
      const eurcWei = parseUnits(eurcAmount, 6);
      
      // Simplified LP token calculation
      const lpTokens = (usdcWei + eurcWei) / BigInt(2);
      return formatAmount(lpTokens);
    } catch {
      return '—';
    }
  };

  // CALCULATE TOKENS TO BE RECEIVED WHEN REMOVING
  const calculateRemoveAmounts = () => {
    if (!removeAmount || totalLiquidity === BigInt(0)) {
      return { usdc: '—', eurc: '—' };
    }
    
    try {
      const lpToRemove = parseUnits(removeAmount, 6);
      const share = Number(lpToRemove) / Number(totalLiquidity);
      
      const usdcOut = BigInt(Math.floor(Number(reserves.usdc) * share));
      const eurcOut = BigInt(Math.floor(Number(reserves.eurc) * share));
      
      return {
        usdc: formatAmount(usdcOut),
        eurc: formatAmount(eurcOut),
      };
    } catch {
      return { usdc: '—', eurc: '—' };
    }
  };

  // CALCULATE USER'S CURRENT POOL SHARE
  const userPoolShare = () => {
    if (!userAddress || userLiquidity === BigInt(0) || totalLiquidity === BigInt(0)) {
      return '0.00';
    }
    const share = (Number(userLiquidity) / Number(totalLiquidity)) * 100;
    return share.toFixed(4);
  };

  // REAL POOL STATS
  const totalValueLocked = Number(reserves.usdc) + Number(reserves.eurc) * 1.08; // EURC ~1.08 USD
  const stats = [
    { label: 'Total USDC', value: formatAmount(reserves.usdc) },
    { label: 'Total EURC', value: formatAmount(reserves.eurc) },
    { label: 'TVL', value: `$${(totalValueLocked / 1e6).toFixed(2)}` },
    { label: 'Your Share', value: `${userPoolShare()}%`, accent: true },
  ];

  const removeAmounts = calculateRemoveAmounts();

  return (
    <div className="w-full max-w-3xl">
      {/* Pool Stats */}
      <div className="glass-card-strong mb-6 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-semibold text-foreground">
                USDC / EURC Pool
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 md:flex md:items-center md:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <span className={`font-display text-base font-semibold ${s.accent ? 'text-accent' : 'text-foreground'}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card-strong p-5 md:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
              <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-base font-semibold text-foreground">
                Liquidity Position
              </span>
              <span className="text-xs text-muted-foreground">
                {activeTab === 'add' ? 'Deposit tokens to earn fees' : 'Withdraw your share of the pool'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 rounded-full bg-secondary/40 p-1">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === 'add'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === 'remove'
                  ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Remove
            </button>
          </div>
        </div>

        {activeTab === 'add' ? (
          <>
            <label className="mb-1.5 block text-sm text-muted-foreground">USDC Amount</label>
            <div className="glass-input mb-4 flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={usdcAmount}
                onChange={(e) => handleUsdcChange(e.target.value)}
                className="w-full bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <span className="shrink-0 font-display text-sm font-semibold text-muted-foreground">USDC</span>
            </div>
            <label className="mb-1.5 block text-sm text-muted-foreground">EURC Amount</label>
            <div className="glass-input mb-6 flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={eurcAmount}
                onChange={(e) => handleEurcChange(e.target.value)}
                className="w-full bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <span className="shrink-0 font-display text-sm font-semibold text-muted-foreground">EURC</span>
            </div>
            <div className="mb-4 space-y-2 rounded-xl border border-glass-border/40 bg-secondary/20 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Pool share</span>
                <span className="text-foreground">{calculatePoolShare()}%</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>LP tokens received</span>
                <span className="text-foreground">{calculateLPTokens()}</span>
              </div>
            </div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              className="glass-button w-full text-base"
              onClick={isConnected ? addLiquidity : openConnectModal}
              disabled={isConnected && (!usdcAmount || !eurcAmount || isProcessing || isApproving)}
            >
              {!isConnected ? 'Connect Wallet' : isApproving ? 'Approving...' : isProcessing ? 'Adding Liquidity...' : 'Add Liquidity'}
            </button>
          </>
        ) : (
          <>
            <label className="mb-1.5 block text-sm text-muted-foreground">LP Token Amount</label>
            <div className="glass-input mb-6 flex items-center gap-3">
              <input
                type="number"
                placeholder="0.00"
                value={removeAmount}
                onChange={(e) => setRemoveAmount(e.target.value)}
                className="w-full bg-transparent text-xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <span className="shrink-0 font-display text-sm font-semibold text-muted-foreground">LP</span>
            </div>
            <div className="mb-4 space-y-2 rounded-xl border border-glass-border/40 bg-secondary/20 p-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>USDC received</span>
                <span className="text-foreground">{removeAmounts.usdc}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>EURC received</span>
                <span className="text-foreground">{removeAmounts.eurc}</span>
              </div>
            </div>
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              className="glass-button w-full text-base"
              onClick={isConnected ? removeLiquidity : openConnectModal}
              disabled={isConnected && (!removeAmount || parseFloat(removeAmount) <= 0 || isProcessing)}
            >
              {!isConnected ? 'Connect Wallet' : isProcessing ? 'Removing...' : 'Remove Liquidity'}
            </button>
          </>
        )}
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
                {successData.type === 'add' ? 'Liquidity Added!' : 'Liquidity Removed!'}
              </h2>
              <p className="mb-5 text-center text-sm text-muted-foreground">
                {successData.type === 'add' 
                  ? 'Your tokens have been deposited into the pool.' 
                  : 'Your LP tokens have been redeemed.'}
              </p>
              <div className="mb-4 w-full space-y-3 rounded-xl border border-glass-border/40 bg-secondary/30 p-4">
                {successData.type === 'add' ? (
                  <>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="shrink-0 text-muted-foreground">USDC Deposited</span>
                      <span className="text-right font-medium text-foreground">{parseFloat(successData.usdcAmount).toFixed(4)} USDC</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="shrink-0 text-muted-foreground">EURC Deposited</span>
                      <span className="text-right font-medium text-foreground">{parseFloat(successData.eurcAmount).toFixed(4)} EURC</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="shrink-0 text-muted-foreground">USDC Received</span>
                      <span className="text-right font-medium text-foreground">{parseFloat(successData.usdcAmount).toFixed(4)} USDC</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="shrink-0 text-muted-foreground">EURC Received</span>
                      <span className="text-right font-medium text-foreground">{parseFloat(successData.eurcAmount).toFixed(4)} EURC</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="shrink-0 text-muted-foreground">Network</span>
                  <span className="font-medium text-foreground">Arc Testnet</span>
                </div>
              </div>
              {successData.txHash && (
                <div className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-glass-border/40 bg-secondary/20 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      Tx Hash
                    </p>
                    <p className="truncate font-mono text-xs text-foreground">
                      {successData.txHash.slice(0, 10)}...{successData.txHash.slice(-8)}
                    </p>
                  </div>
                  
                 <a
                    href={`https://testnet.arcscan.app/tx/${successData.txHash}`}
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