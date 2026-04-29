'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { Token } from '@/config/tokens';
import { CONTRACTS } from '@/config/wagmi';
import { ERC20_ABI, SIMPLE_DEX_ABI } from '@/config/abis';
import { addTransaction, updateTransactionStatus } from '@/components/TransactionHistory';

interface SwapState {
  isLoading: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  error: string | null;
  txHash: string | null;
}

export function useSwap(
  fromToken: Token | null,
  toToken: Token | null,
  amount: string,
  slippage: number = 0.5
) {
  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [state, setState] = useState<SwapState>({
    isLoading: false,
    isApproving: false,
    isSwapping: false,
    error: null,
    txHash: null,
  });

  const [outputAmount, setOutputAmount] = useState<string>('0');
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [reserves, setReserves] = useState<{ usdc: bigint; eurc: bigint }>({ usdc: BigInt(0), eurc: BigInt(0) });

  // Calculate amount in wei
  const amountInWei = fromToken && amount && parseFloat(amount) > 0
    ? parseUnits(amount, fromToken.decimals)
    : BigInt(0);

  // Fetch reserves from SimpleDEX
  useEffect(() => {
    const fetchReserves = async () => {
      if (!publicClient) return;

      try {
        const [reserveUSDC, reserveEURC] = await Promise.all([
          publicClient.readContract({
            address: CONTRACTS.simpleDex as `0x${string}`,
            abi: SIMPLE_DEX_ABI,
            functionName: 'reserveUSDC',
          }),
          publicClient.readContract({
            address: CONTRACTS.simpleDex as `0x${string}`,
            abi: SIMPLE_DEX_ABI,
            functionName: 'reserveEURC',
          }),
        ]);

        setReserves({
          usdc: reserveUSDC as bigint,
          eurc: reserveEURC as bigint,
        });
      } catch (error) {
        console.error('Error fetching reserves:', error);
      }
    };

    fetchReserves();
    const interval = setInterval(fetchReserves, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [publicClient]);

  // Fetch quote from SimpleDEX
  useEffect(() => {
    const fetchQuote = async () => {
      if (!publicClient || !fromToken || !toToken || amountInWei === BigInt(0)) {
        setOutputAmount('0');
        return;
      }

      // Only support USDC/EURC pair
      if (!['USDC', 'EURC'].includes(fromToken.symbol) || !['USDC', 'EURC'].includes(toToken.symbol)) {
        setOutputAmount('0');
        setState(prev => ({ ...prev, error: 'Only USDC/EURC swaps are supported' }));
        return;
      }

      // Check if pool has liquidity
      if (reserves.usdc === BigInt(0) || reserves.eurc === BigInt(0)) {
        setOutputAmount('0');
        setState(prev => ({ ...prev, error: 'Pool has no liquidity. Add liquidity first.' }));
        return;
      }

      setIsQuoteLoading(true);
      setState(prev => ({ ...prev, error: null }));

      try {
        // Determine reserves based on swap direction
        const reserveIn = fromToken.symbol === 'USDC' ? reserves.usdc : reserves.eurc;
        const reserveOut = fromToken.symbol === 'USDC' ? reserves.eurc : reserves.usdc;

        // Call getAmountOut on SimpleDEX
        const result = await publicClient.readContract({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName: 'getAmountOut',
          args: [amountInWei, reserveIn, reserveOut],
        });

        const formatted = formatUnits(result as bigint, toToken.decimals);
        setOutputAmount(formatted);
        setState(prev => ({ ...prev, error: null }));
      } catch (error: any) {
        console.error('Quote error:', error);
        setOutputAmount('0');
        setState(prev => ({ ...prev, error: 'Unable to fetch quote' }));
      } finally {
        setIsQuoteLoading(false);
      }
    };

    fetchQuote();
  }, [publicClient, fromToken, toToken, amountInWei, reserves]);

  // Fetch allowance for SimpleDEX
  useEffect(() => {
    const fetchAllowance = async () => {
      if (!publicClient || !fromToken || !userAddress || fromToken.isNative) {
        setAllowance(BigInt(0));
        return;
      }

      try {
        const result = await publicClient.readContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
        });
        setAllowance(result as bigint);
      } catch (error) {
        console.error('Allowance error:', error);
        setAllowance(BigInt(0));
      }
    };

    fetchAllowance();
  }, [publicClient, fromToken, userAddress]);

  // Check if approval needed
  const needsApproval = fromToken && !fromToken.isNative && amountInWei > BigInt(0) && allowance < amountInWei;

  // Calculate minimum output with slippage
  const minOutputAmount = outputAmount !== '0' && toToken
    ? parseUnits(
        (parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(toToken.decimals),
        toToken.decimals
      )
    : BigInt(0);

  // Approve token for SimpleDEX
  const approve = useCallback(async () => {
    if (!walletClient || !fromToken || !userAddress) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isApproving: true, error: null }));

    try {
      const hash = await walletClient.writeContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.simpleDex as `0x${string}`, maxUint256],
      });

      setState(prev => ({ ...prev, txHash: hash }));

      // Log approval transaction
      addTransaction(userAddress, {
        hash,
        type: 'approve',
        fromToken: fromToken.symbol,
        status: 'pending',
        timestamp: Date.now(),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
        updateTransactionStatus(userAddress, hash, 'success');

        const newAllowance = await publicClient.readContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
        });
        setAllowance(newAllowance as bigint);
      }

      // Clear approval txHash so approval transactions don't trigger the global success modal.
      setState(prev => ({ ...prev, isApproving: false, txHash: null }));
      return hash;
    } catch (error: any) {
      const errorMsg = error.shortMessage || error.message || 'Approval failed';
      setState(prev => ({ ...prev, isApproving: false, error: errorMsg }));
      throw error;
    }
  }, [walletClient, publicClient, fromToken, userAddress]);

  // Execute swap via SimpleDEX
  const swap = useCallback(async () => {
    if (!walletClient || !publicClient || !fromToken || !toToken || !userAddress || !amount) {
      throw new Error('Missing required data');
    }

    setState(prev => ({ ...prev, isSwapping: true, error: null }));

    try {
      const amountIn = parseUnits(amount, fromToken.decimals);

      // Always verify current on-chain allowance before swapping (not relying on state)
      const currentAllowance = await publicClient.readContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
      });

      if ((currentAllowance as bigint) < amountIn) {
        // Need approval - do it and wait
        await approve();
        
        // Verify again after approval
        const newAllowance = await publicClient.readContract({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
        });
        
        if ((newAllowance as bigint) < amountIn) {
          throw new Error('Allowance not confirmed on-chain. Please try again.');
        }
      }

      // Calculate deadline (20 minutes from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

      // Determine which swap function to call
      const isUsdcToEurc = fromToken.symbol === 'USDC';
      const functionName = isUsdcToEurc ? 'swapUSDCForEURC' : 'swapEURCForUSDC';

      // Includes deadline parameter
      const hash = await walletClient.writeContract({
        address: CONTRACTS.simpleDex as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName,
        args: [amountIn, minOutputAmount, deadline],
      });

      setState(prev => ({ ...prev, txHash: hash }));

      // Log swap transaction
      addTransaction(userAddress, {
        hash,
        type: 'swap',
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount: amount,
        toAmount: parseFloat(outputAmount).toFixed(6),
        status: 'pending',
        timestamp: Date.now(),
      });

      // Wait for transaction and check status
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'reverted') {
        updateTransactionStatus(userAddress, hash, 'failed');
        setState(prev => ({ 
          ...prev, 
          isSwapping: false, 
          error: 'Transaction failed. Check allowance or try reducing amount.' 
        }));
        throw new Error('Transaction reverted');
      }

      updateTransactionStatus(userAddress, hash, 'success');
      // Keep the swap txHash so the UI can show a success modal; do not clear it here.
      setState(prev => ({ ...prev, isSwapping: false, error: null, txHash: hash }));
      return hash;
    } catch (error: any) {
      console.error('Swap error:', error);
      let errorMsg = 'Swap failed';
      
      if (error.shortMessage) {
        errorMsg = error.shortMessage;
      } else if (error.message?.includes('user rejected')) {
        errorMsg = 'Transaction rejected by user';
      } else if (error.message?.includes('insufficient') || error.message?.includes('Insufficient')) {
        errorMsg = 'Insufficient balance or liquidity';
      } else if (error.message?.includes('expired') || error.message?.includes('Deadline')) {
        errorMsg = 'Transaction deadline expired';
      }
      
      setState(prev => ({ ...prev, isSwapping: false, error: errorMsg }));
      throw error;
    }
  }, [walletClient, publicClient, fromToken, toToken, userAddress, amount, outputAmount, minOutputAmount, needsApproval, approve]);

  // Calculate exchange rate
  const exchangeRate = amount && parseFloat(amount) > 0 && parseFloat(outputAmount) > 0
    ? parseFloat(outputAmount) / parseFloat(amount)
    : 0;

  return {
    outputAmount,
    exchangeRate,
    isQuoteLoading,
    needsApproval: !!needsApproval,
    reserves,
    approve,
    swap,
    ...state,
  };
}