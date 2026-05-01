import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getExplorerUrl } from '@/config/wagmi';

export interface Transaction {
  hash: string;
  type: 'swap' | 'approve' | 'addLiquidity' | 'removeLiquidity' | 'bridge';
  fromToken?: string;
  toToken?: string;
  fromAmount?: string;
  toAmount?: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

const getStoredTransactions = (address: string): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(`tx_history_${address.toLowerCase()}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTransactions = (address: string, transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = transactions.slice(0, 50);
    localStorage.setItem(`tx_history_${address.toLowerCase()}`, JSON.stringify(trimmed));
  } catch {
    console.error('Failed to save transactions');
  }
};

export const addTransaction = (address: string, tx: Transaction) => {
  const existing = getStoredTransactions(address);
  const updated = [tx, ...existing.filter(t => t.hash !== tx.hash)];
  saveTransactions(address, updated);
  window.dispatchEvent(new CustomEvent('transaction_added', { detail: tx }));
};

export const updateTransactionStatus = (address: string, hash: string, status: 'success' | 'failed') => {
  const existing = getStoredTransactions(address);
  const updated = existing.map(tx => 
    tx.hash === hash ? { ...tx, status } : tx
  );
  saveTransactions(address, updated);
  window.dispatchEvent(new CustomEvent('transaction_updated', { detail: { hash, status } }));
};

export default function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (address) {
      setTransactions(getStoredTransactions(address));
    } else {
      setTransactions([]);
    }
  }, [address]);

  useEffect(() => {
    const handleAdded = () => {
      if (address) setTransactions(getStoredTransactions(address));
    };
    const handleUpdated = () => {
      if (address) setTransactions(getStoredTransactions(address));
    };

    window.addEventListener('transaction_added', handleAdded);
    window.addEventListener('transaction_updated', handleUpdated);

    return () => {
      window.removeEventListener('transaction_added', handleAdded);
      window.removeEventListener('transaction_updated', handleUpdated);
    };
  }, [address]);

  const clearHistory = () => {
    if (address) {
      localStorage.removeItem(`tx_history_${address.toLowerCase()}`);
      setTransactions([]);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeInfo = (type: Transaction['type']) => {
    switch (type) {
      case 'swap':
        return { 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
          label: 'Swap',
          color: 'text-accent-purple'
        };
      case 'approve':
        return { 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Approve',
          color: 'text-blue-400'
        };
      case 'addLiquidity':
        return { 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          ),
          label: 'Add Liquidity',
          color: 'text-green-400'
        };
      case 'removeLiquidity':
        return { 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
          label: 'Remove Liquidity',
          color: 'text-orange-400'
        };
      case 'bridge':
        return { 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ),
          label: 'Bridge',
          color: 'text-cyan-400'
        };
      default:
        return { icon: null, label: 'Transaction', color: 'text-gray-400' };
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
            <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
            Pending
          </span>
        );
      case 'success':
        return (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">
            Success
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">
            Failed
          </span>
        );
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md mx-auto animate-slideUp">
        <div className="glass-card rounded-2xl p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Transaction History</h2>
          <p className="text-gray-400 mb-4">Connect your wallet to view your transaction history</p>
        </div>
      </div>
    );
  }

  const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 5);
  const hasMore = transactions.length > 5;

  return (
    <div className="w-full max-w-md mx-auto animate-slideUp">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-primary-600/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-purple/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Transaction History</h2>
              <p className="text-sm text-gray-400">
                {transactions.length === 0 
                  ? 'No transactions yet' 
                  : `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          </div>
          {transactions.length > 0 && (
            <button
              onClick={clearHistory}
              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="divide-y divide-primary-600/20">
          {transactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-700/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-400 text-lg font-medium mb-2">No transactions yet</p>
              <p className="text-gray-500 text-sm">Your swap and liquidity transactions will appear here</p>
            </div>
          ) : (
            <>
              {displayedTransactions.map((tx) => {
                const typeInfo = getTypeInfo(tx.type);
                return (
                  <div key={tx.hash} className="p-4 hover:bg-primary-800/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full bg-primary-700/50 flex items-center justify-center ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {getStatusBadge(tx.status)}
                          </div>
                          {tx.type === 'swap' && tx.fromToken && tx.toToken && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tx.fromAmount} {tx.fromToken} → {tx.toAmount} {tx.toToken}
                            </p>
                          )}
                          {tx.type === 'addLiquidity' && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Added {tx.fromAmount} USDC + {tx.toAmount} EURC
                            </p>
                          )}
                          {tx.type === 'removeLiquidity' && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Removed {tx.fromAmount} LP tokens
                            </p>
                          )}
                          {tx.type === 'approve' && tx.fromToken && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Approved {tx.fromToken}
                            </p>
                          )}
                          {tx.type === 'bridge' && tx.fromToken && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Bridged {tx.fromAmount} {tx.fromToken}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">{formatTime(tx.timestamp)}</p>
                        <a
                          href={getExplorerUrl(tx.hash, 'tx')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-purple hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          View
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}

              {hasMore && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full p-4 text-sm text-gray-400 hover:text-white hover:bg-primary-800/30 transition-colors flex items-center justify-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      Show Less
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </>
                  ) : (
                    <>
                      Show {transactions.length - 5} More
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}