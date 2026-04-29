'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Settings, ChevronDown } from 'lucide-react';
import { Token, TOKENS, formatTokenAmount } from '@/config/tokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useSwap } from '@/hooks/useSwap';
import TokenIcon from './TokenIcon';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export default function NewSwapCard() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [fromToken, setFromToken] = useState<Token>(TOKENS.USDC);
  const [toToken, setToToken] = useState<Token>(TOKENS.EURC);
  const [amount, setAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  const { balance: fromBalance } = useTokenBalance(fromToken);
  const { balance: toBalance } = useTokenBalance(toToken);

  const {
    outputAmount,
    needsApproval,
    isApproving,
    isSwapping,
    approve,
    swap,
  } = useSwap(fromToken, toToken, amount, slippage);

  const handleSwap = async () => {
    if (needsApproval) {
      await approve();
    } else {
      await swap();
      setAmount('');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="glass-card rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Swap</h2>
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
            <Settings className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* You Pay */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">You Pay</span>
            <span className="text-sm text-muted">
              Balance: {formatTokenAmount(fromBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              className="flex-1 bg-transparent text-3xl font-medium text-foreground outline-none"
            />
            <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-full hover:bg-secondary transition-colors">
              <TokenIcon symbol={fromToken.symbol} logoURI={fromToken.logoURI} />
              <span className="font-semibold">{fromToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>
          </div>
          <div className="mt-2 text-sm text-muted">$0.00</div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center -my-2 relative z-10">
          <button className="w-9 h-9 bg-secondary border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* You Receive */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted">You Receive</span>
            <span className="text-sm text-muted">
              Balance: {formatTokenAmount(toBalance)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <input
              type="text"
              placeholder="0.00"
              value={outputAmount !== '0' ? parseFloat(outputAmount).toFixed(6) : ''}
              readOnly
              className="flex-1 bg-transparent text-3xl font-medium text-foreground outline-none opacity-70"
            />
            <button className="flex items-center gap-2 px-3 py-2 border border-border rounded-full hover:bg-secondary transition-colors">
              <TokenIcon symbol={toToken.symbol} logoURI={toToken.logoURI} />
              <span className="font-semibold">{toToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-muted" />
            </button>
          </div>
          <div className="mt-2 text-sm text-muted">$0.00</div>
        </div>

        {/* Connect Wallet Button */}
        <div className="mt-6">
          {!isConnected ? (
            <button
              onClick={openConnectModal}
              className="w-full py-3.5 bg-primary text-background rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              Connect Wallet
            </button>
          ) : (
            <button
              onClick={handleSwap}
              disabled={isApproving || isSwapping || !amount || parseFloat(amount) === 0}
              className="w-full py-3.5 bg-primary text-background rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isApproving ? 'Approving...' : isSwapping ? 'Swapping...' : needsApproval ? 'Approve' : 'Swap'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}