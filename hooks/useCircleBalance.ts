import { useState, useEffect } from 'react';
import { useUserWallet } from '@/contexts/UserWalletContext';

export function useCircleBalance(tokenSymbol: 'USDC' | 'EURC') {
  const { wallet } = useUserWallet();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    if (!wallet) {
      setBalance('0');
      return;
    }

    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/wallets/balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            walletAddress: wallet.address,  // Changed from walletId
            tokenSymbol 
          }),
        });
        
        const data = await res.json();
        if (data.success) {
          setBalance(data.balance);
        }
      } catch (e) {
        console.error('Balance error:', e);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [wallet, tokenSymbol]);

  return { balance };
}