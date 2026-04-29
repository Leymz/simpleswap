import { ReactNode } from 'react';
import { ArrowLeftRight, Droplets, Waypoints } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'swap' | 'liquidity' | 'bridge';
  setActiveTab: (tab: 'swap' | 'liquidity' | 'bridge') => void;
  onConnectWallet: () => void;
  isConnected: boolean;
  address?: string;
}

export default function Layout({ 
  children, 
  activeTab, 
  setActiveTab,
  onConnectWallet,
  isConnected,
  address 
}: LayoutProps) {
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-heading text-xl font-bold">
              Simple<span className="text-primary">Swap</span>
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">
              Faucet
            </button>
            
            {isConnected && address ? (
              <button
                onClick={onConnectWallet}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                {formatAddress(address)}
              </button>
            ) : (
              <button
                onClick={onConnectWallet}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="pt-16 pb-24 px-4">
        {children}
      </main>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border">
        <div className="max-w-md mx-auto px-4 h-20 flex items-center justify-center gap-4">
          <button
            onClick={() => setActiveTab('swap')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'swap'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted hover:text-foreground hover:bg-secondary'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            Swap
          </button>
          
          <button
            onClick={() => setActiveTab('bridge')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'bridge'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Waypoints className="w-5 h-5" />
            Bridge
          </button>
          
          <button
            onClick={() => setActiveTab('liquidity')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'liquidity'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'text-muted hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Droplets className="w-5 h-5" />
            Liquidity
          </button>
        </div>
      </div>
    </div>
  );
}