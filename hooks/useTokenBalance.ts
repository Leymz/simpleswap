import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { Token } from '@/config/tokens';
import { useState, useEffect, useCallback } from 'react';

// ERC20 balanceOf ABI
const balanceOfAbi = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useTokenBalance(token: Token | null) {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  // For native USDC (which is the native currency on Arc)
  const { data: nativeBalance, refetch: refetchNative } = useBalance({
    address: userAddress,
    query: {
      enabled: isConnected && !!userAddress && token?.isNative === true,
    },
  });

  // Fetch ERC20 balance manually
  const fetchERC20Balance = useCallback(async () => {
    if (!publicClient || !userAddress || !token || token.isNative) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await publicClient.readContract({
        address: token.address as `0x${string}`,
        abi: balanceOfAbi,
        functionName: 'balanceOf',
        args: [userAddress],
      });

      const formatted = formatUnits(result as bigint, token.decimals);
      setBalance(formatted);
    } catch (error) {
      console.error(`Error fetching balance for ${token.symbol}:`, error);
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, userAddress, token]);

  // Refetch function
  const refetch = useCallback(async () => {
    if (token?.isNative) {
      await refetchNative();
    } else {
      await fetchERC20Balance();
    }
  }, [token, refetchNative, fetchERC20Balance]);

  // Effect to fetch balance when token or address changes
  useEffect(() => {
    if (!isConnected || !token || !userAddress) {
      setBalance('0');
      return;
    }

    if (token.isNative && nativeBalance) {
      // Native USDC - format from 18 decimals
      setBalance(formatUnits(nativeBalance.value, 18));
    } else if (!token.isNative) {
      // ERC20 token
      fetchERC20Balance();
    }
  }, [isConnected, token, userAddress, nativeBalance, fetchERC20Balance]);

  return {
    balance,
    isLoading,
    refetch,
    isConnected,
  };
}
