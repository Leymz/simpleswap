'use client';

import { Token, TOKENS } from '@/config/tokens';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import TokenIcon from './TokenIcon';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  selectedToken: Token;
  otherToken: Token;
}

const allTokens = [
  TOKENS.USDC,
  TOKENS.EURC,
  { ...TOKENS.USDC, symbol: 'USDY', name: 'US Yield Coin', address: '0x0000000000000000000000000000000000000000' } as Token,
];

export default function TokenSelector({
  isOpen,
  onClose,
  onSelect,
  selectedToken,
  otherToken,
}: TokenSelectorProps) {
  if (!isOpen) return null;

  const handleSelect = (token: Token) => {
    if (token.symbol === 'USDY') return; // Disabled
    if (token.address === otherToken.address) return; // Can't select same as other
    onSelect(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-card-strong max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">Select Token</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
          >
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name or address"
          className="glass-input mb-4 w-full text-sm"
          readOnly
        />

        <div className="space-y-1">
          {allTokens.map((token) => {
            const isDisabled = token.symbol === 'USDY';
            const isSelected = token.address === selectedToken.address;
            const isOther = token.address === otherToken.address;
            const { balance } = useTokenBalance(token);

            return (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                disabled={isDisabled || isOther}
                className={`w-full flex items-center justify-between rounded-xl p-3 transition-colors ${
                  isDisabled || isOther
                    ? 'cursor-not-allowed opacity-40'
                    : isSelected
                    ? 'bg-primary/15 border border-primary/30'
                    : 'hover:bg-secondary/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={token.symbol} logoURI={token.logoURI} />
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                </div>
                <div className="text-right font-mono text-sm text-foreground">
                  {!isDisabled && parseFloat(balance).toFixed(4)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}