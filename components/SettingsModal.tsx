'use client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slippage: number;
  setSlippage: (value: number) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  slippage,
  setSlippage,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const slippageOptions = [0.1, 0.5, 1];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md mx-4 rounded-2xl border border-glass-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'hsl(var(--card))' }}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-secondary"
          >
            <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-foreground">
            Slippage Tolerance
          </h3>
          <div className="mb-4 flex gap-2">
            {slippageOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSlippage(option)}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  slippage === option
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-secondary text-muted-foreground hover:bg-muted'
                }`}
              >
                {option}%
              </button>
            ))}
            <div className="relative flex-1">
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={slippage}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0.1 && val <= 50) {
                    setSlippage(val);
                  }
                }}
                className="w-full rounded-xl border border-glass-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground outline-none focus:border-primary/30"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                %
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your transaction will revert if the price changes unfavorably by more than this percentage.
          </p>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary/15 py-3 font-semibold text-primary transition-colors hover:bg-primary/25"
        >
          Done
        </button>
      </div>
    </div>
  );
}