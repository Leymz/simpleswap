'use client';

import { useState } from 'react';
import Head from 'next/head';
import Header from '@/components/Header';
import SwapCard from '@/components/SwapCard';
import BridgeCard from '@/components/BridgeCard';
import LiquidityCard from '@/components/LiquidityCard';
import FaucetCard from '@/components/FaucetCard';
import BottomNav from '@/components/BottomNav';
import TransactionHistory from '@/components/TransactionHistory';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'bridge' | 'liquidity' | 'faucet' | 'history'>('swap');

  return (
    <>
      <Head>
        <title>SimpleDEX - Arc Testnet</title>
      </Head>

      <div className="relative min-h-screen flex flex-col">
        <div className="arc-bg">
          <div className="arc-bg-inner" />
        </div>
        <div className="noise-overlay" />
        
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />
        
        <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-8 pb-32 md:pt-16">
          {activeTab === 'swap' && (
            <>
              <p className="mb-8 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Exchange Made Effortless
              </p>
              <div className="relative mb-10">
                <svg
                  className="absolute -top-6 left-1/2 -translate-x-1/3 w-14 h-7"
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
                <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
                  Simple <span className="text-primary">Swap</span>
                </h1>
              </div>
              <SwapCard />
            </>
          )}

          {activeTab === 'bridge' && (
            <>
              <h1 className="mb-2 font-display text-4xl font-bold text-foreground">Bridge</h1>
              <p className="mb-10 text-sm text-muted-foreground">
                Move stablecoins across chains in a few clicks
              </p>
              <BridgeCard />
            </>
          )}

          {activeTab === 'liquidity' && (
            <>
              <h1 className="mb-2 font-display text-4xl font-bold text-foreground">Liquidity</h1>
              <p className="mb-8 text-sm text-muted-foreground">
                Provide liquidity and earn fees on every swap
              </p>
              <LiquidityCard />
            </>
          )}

          {activeTab === 'faucet' && <FaucetCard />}

          {activeTab === 'history' && (
            <>
              <h1 className="mb-2 font-display text-4xl font-bold text-foreground">Transaction History</h1>
              <p className="mb-10 text-sm text-muted-foreground">
                View your past swaps, bridges, and liquidity operations
              </p>
              <TransactionHistory />
            </>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Built on Arc testnet. Not affiliated to Arc or Circle.
          </p>
        </main>

        <BottomNav 
          activeTab={activeTab as 'swap' | 'bridge' | 'liquidity'} 
          setActiveTab={(tab) => setActiveTab(tab as 'swap' | 'bridge' | 'liquidity' | 'faucet' | 'history')} 
        />
      </div>
    </>
  );
}