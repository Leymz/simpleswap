'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Clock } from 'lucide-react';

interface NewHeaderProps {
  activeTab: 'swap' | 'bridge' | 'liquidity' | 'faucet';
  setActiveTab: (tab: 'swap' | 'bridge' | 'liquidity' | 'faucet') => void;
}

export default function NewHeader({ activeTab, setActiveTab }: NewHeaderProps) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <header className="w-full border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background font-bold">
              S
            </div>
            <div>
              <h1 className="text-base font-semibold">SimpleDEX</h1>
              <p className="text-xs text-muted">Arc Testnet</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('swap')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'swap'
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab('bridge')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'bridge'
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Bridge
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'liquidity'
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Liquidity
            </button>
            <button
              onClick={() => setActiveTab('faucet')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'faucet'
                  ? 'text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Faucet
            </button>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Network indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-foreground font-medium">Arc Testnet</span>
            </div>

            {/* History button */}
            <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
              <Clock className="w-5 h-5 text-muted" />
            </button>

            {/* Connect Wallet */}
            {isConnected && address ? (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 bg-primary text-background rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                {formatAddress(address)}
              </button>
            ) : (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 bg-primary text-background rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}