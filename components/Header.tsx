'use client';

import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface HeaderProps {
  activeTab: 'swap' | 'liquidity' | 'faucet' | 'bridge' | 'history';
  setActiveTab: (tab: 'swap' | 'liquidity' | 'faucet' | 'bridge' | 'history') => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const { isConnected, address } = useAccount();
  const { openConnectModal } = useConnectModal();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 md:px-12">
      <div className="flex items-center gap-4">
        <div className="relative">
          <svg
            className="absolute -top-4 left-1/2 -translate-x-1/3 w-10 h-5"
            viewBox="0 0 36 18"
            fill="none"
          >
            <path
              d="M3 14C5 5 10 2 15 7"
              stroke="hsl(var(--primary))"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M19 14C21 5 26 2 31 7"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Simple<span className="text-primary">Swap</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://github.com/Leymz/simpleswap" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <a href="https://x.com/nft_leymz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
        </div>
      </div>

      <nav className="glass-nav flex items-center gap-1">
        <a
          href="https://faucet.circle.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground"
        >
          Faucet
        </a>
        <button
          onClick={() => setActiveTab('history')}
          className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-primary/15 text-primary border border-primary/30 shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          History
        </button>
      </nav>

      {isConnected && address ? (
        <button
          onClick={openConnectModal}
          className="glass-button flex items-center gap-2 px-4 py-2 text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="hidden md:inline font-mono">{formatAddress(address)}</span>
        </button>
      ) : (
        <button
          onClick={openConnectModal}
          className="glass-button flex items-center gap-2 px-4 py-2 text-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="hidden md:inline">Connect Wallet</span>
        </button>
      )}
    </header>
  );
}