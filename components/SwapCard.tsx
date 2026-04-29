'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { Token, TOKENS, formatTokenAmount, formatUsdValue } from '@/config/tokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useSwap } from '@/hooks/useSwap';
import TokenSelector from './TokenSelector';
import SettingsModal from './SettingsModal';
import TokenIcon from './TokenIcon';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export default function SwapCard() {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();
  
  const [fromToken, setFromToken] = useState<Token>(TOKENS.USDC);
  const [toToken, setToToken] = useState<Token>(TOKENS.EURC);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Track which txHash we've already shown/dismissed the success modal for
  const [dismissedTxHash, setDismissedTxHash] = useState<string | null>(null);

  const { balance: fromBalance, refetch: refetchFrom } = useTokenBalance(fromToken);
  const { balance: toBalance, refetch: refetchTo } = useTokenBalance(toToken);

  const {
    outputAmount,
    exchangeRate,
    isQuoteLoading,
    needsApproval,
    isApproving,
    isSwapping,
    error,
    txHash,
    approve,
    swap,
  } = useSwap(fromToken, toToken, amount, slippage);

  // Success modal logic: only show once per successful txHash, hide on errors
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

  // Refetch balances when address changes
  useEffect(() => {
    if (address) {
      refetchFrom();
      refetchTo();
    }
  }, [address, refetchFrom, refetchTo]);

  const handleSwitch = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount(outputAmount !== '0' ? outputAmount : '');
  }, [toToken, fromToken, outputAmount]);

  const handleMaxClick = useCallback(() => {
    setAmount(fromBalance);
  }, [fromBalance]);

  const handleSwap = useCallback(async () => {
    try {
      await swap();
      setTimeout(() => {
        refetchFrom();
        refetchTo();
      }, 2000);
    } catch (e) {
      console.error('Swap failed:', e);
    }
  }, [swap, refetchFrom, refetchTo]);

  const handleDismissSuccess = useCallback(() => {
    setShowSuccess(false);
    setDismissedTxHash(txHash);
    setAmount('');
  }, [txHash]);

  const getButtonContent = useCallback(() => {
    if (!isConnected) return 'Connect Wallet';
    if (!amount || parseFloat(amount) === 0) return 'Enter Amount';
    if (parseFloat(amount) > parseFloat(fromBalance)) return `Insufficient ${fromToken.symbol}`;
    if (isApproving) return 'Approving...';
    if (needsApproval) return `Approve ${fromToken.symbol}`;
    if (isSwapping) return 'Swapping...';
    if (isQuoteLoading) return 'Getting Quote...';
    return 'Swap';
  }, [isConnected, amount, fromBalance, fromToken.symbol, isApproving, needsApproval, isSwapping, isQuoteLoading]);

  const isButtonDisabled = useCallback(() => {
    if (!isConnected) return false;
    if (!amount || parseFloat(amount) === 0) return true;
    if (parseFloat(amount) > parseFloat(fromBalance)) return true;
    if (isApproving || isSwapping) return true;
    return false;
  }, [isConnected, amount, fromBalance, isApproving, isSwapping]);

  const handleSwapClick = useCallback(() => {
    if (!isConnected) {
      openConnectModal?.();
    } else if (needsApproval) {
      approve();
    } else {
      handleSwap();
    }
  }, [isConnected, needsApproval, openConnectModal, approve, handleSwap]);

  const fromUsdValue = parseFloat(amount || '0') * (fromToken.priceUSD || 0);
  const toUsdValue = parseFloat(outputAmount || '0') * (toToken.priceUSD || 0);

  return (
    <>
      <div className="glass-card-strong w-full max-w-md p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Swap</h2>
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
          >
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* FROM */}
        <div className="mb-2">
          <div className="glass-input flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              className="w-full bg-transparent text-2xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={() => setShowFromSelector(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-secondary px-3 py-1.5"
            >
              <span className="text-lg">{fromToken.symbol === 'USDC' ? '💲' : '💶'}</span>
              <span className="font-display text-sm font-semibold text-foreground">
                {fromToken.symbol}
              </span>
            </button>
          </div>
          {address && (
            <div className="mt-1.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>${fromUsdValue.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-mono">{parseFloat(fromBalance || '0').toFixed(4)} {fromToken.symbol}</span>
                <button
                  onClick={handleMaxClick}
                  className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary/25"
                >
                  Max
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="my-3 flex items-center justify-center">
          <button
            onClick={handleSwitch}
            className="rounded-full border border-glass-border bg-secondary p-2 transition-all duration-200 hover:scale-110 hover:bg-muted"
          >
            <svg className="h-4 w-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* TO */}
        <div className="mb-4">
          <div className="glass-input flex items-center justify-between gap-3">
            <input
              type="number"
              placeholder="0.00"
              value={isQuoteLoading ? '...' : outputAmount !== '0' ? parseFloat(outputAmount).toFixed(6) : ''}
              readOnly
              className="w-full bg-transparent text-2xl font-medium text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={() => setShowToSelector(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-secondary px-3 py-1.5"
            >
              <span className="text-lg">{toToken.symbol === 'USDC' ? '💲' : '💶'}</span>
              <span className="font-display text-sm font-semibold text-foreground">
                {toToken.symbol}
              </span>
            </button>
          </div>
          {address && (
            <div className="mt-1.5 flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>${toUsdValue.toFixed(2)}</span>
              <div className="flex items-center gap-2">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-mono">{parseFloat(toBalance || '0').toFixed(4)} {toToken.symbol}</span>
              </div>
            </div>
          )}
        </div>

        {amount && parseFloat(amount) > 0 && exchangeRate > 0 && (
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Rate</span>
            <span>1 {fromToken.symbol} ≈ {exchangeRate.toFixed(4)} {toToken.symbol}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleSwapClick}
          disabled={isButtonDisabled()}
          className="glass-button w-full text-base"
        >
          {getButtonContent()}
        </button>
      </div>

      {/* Success Dialog */}
      {showSuccess && txHash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card-strong max-w-sm border-glass-border bg-background/80 p-6 backdrop-blur-2xl">
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
                Swap Completed
              </h2>
              <p className="mb-5 text-center text-sm text-muted-foreground">
                Your tokens have been swapped successfully.
              </p>
              <div className="mb-4 w-full space-y-2 rounded-xl border border-glass-border/40 bg-secondary/30 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sent</span>
                  <span className="font-medium text-foreground">{amount} {fromToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Received</span>
                  <span className="font-medium text-foreground">{parseFloat(outputAmount).toFixed(6)} {toToken.symbol}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <span className="font-medium text-foreground">Arc Testnet</span>
                </div>
              </div>
              <div className="mb-5 flex w-full items-center justify-between gap-2 rounded-xl border border-glass-border/40 bg-secondary/20 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Tx Hash
                  </p>
                  <p className="truncate font-mono text-xs text-foreground">{txHash.slice(0, 10)}...{txHash.slice(-8)}</p>
                </div>
                <a
                  href={`https://testnet.arcscan.app/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
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

      <TokenSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        onSelect={setFromToken}
        selectedToken={fromToken}
        otherToken={toToken}
      />
      <TokenSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        onSelect={setToToken}
        selectedToken={toToken}
        otherToken={fromToken}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        slippage={slippage}
        setSlippage={setSlippage}
      />
    </>
  );
}