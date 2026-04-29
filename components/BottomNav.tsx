'use client';

interface BottomNavProps {
  activeTab: 'swap' | 'bridge' | 'liquidity';
  setActiveTab: (tab: 'swap' | 'bridge' | 'liquidity') => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <nav className="glass-nav flex items-center gap-1 px-3 py-2 shadow-2xl shadow-primary/10">
        <button
          onClick={() => setActiveTab('swap')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'swap'
              ? 'bg-primary/25 text-primary border border-primary/50 shadow-lg shadow-primary/20'
              : 'text-foreground/70 hover:text-foreground border border-transparent hover:bg-secondary/40'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>Swap</span>
        </button>
        <button
          onClick={() => setActiveTab('bridge')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'bridge'
              ? 'bg-primary/25 text-primary border border-primary/50 shadow-lg shadow-primary/20'
              : 'text-foreground/70 hover:text-foreground border border-transparent hover:bg-secondary/40'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Bridge</span>
        </button>
        <button
          onClick={() => setActiveTab('liquidity')}
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'liquidity'
              ? 'bg-primary/25 text-primary border border-primary/50 shadow-lg shadow-primary/20'
              : 'text-foreground/70 hover:text-foreground border border-transparent hover:bg-secondary/40'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>Liquidity</span>
        </button>
      </nav>
    </div>
  );
}