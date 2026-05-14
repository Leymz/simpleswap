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
    if (!walletClient || !fromToken || !userAddress || !publicClient) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isApproving: true, error: null }));

    try {
      // Estimate gas for approval with 20% buffer
      let estimatedGas: bigint;
      try {
        estimatedGas = await publicClient.estimateContractGas({
          address: fromToken.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [CONTRACTS.simpleDex as `0x${string}`, maxUint256],
          account: userAddress,
        });
        // Add 20% buffer
        estimatedGas = (estimatedGas * BigInt(120)) / BigInt(100);
      } catch (gasError) {
        console.warn('Gas estimation failed for approval, using default');
        estimatedGas = BigInt(100000); // Fallback gas limit
      }

      console.log('=== APPROVAL GAS ===', estimatedGas.toString());

      const hash = await walletClient.writeContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.simpleDex as `0x${string}`, maxUint256],
        gas: estimatedGas,
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

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'reverted') {
        updateTransactionStatus(userAddress, hash, 'failed');
        throw new Error('Approval transaction reverted');
      }

      updateTransactionStatus(userAddress, hash, 'success');

      const newAllowance = await publicClient.readContract({
        address: fromToken.address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress, CONTRACTS.simpleDex as `0x${string}`],
      });
      setAllowance(newAllowance as bigint);

      // Clear approval txHash so approval transactions don't trigger the global success modal.
      setState(prev => ({ ...prev, isApproving: false, txHash: null }));
      return hash;
    } catch (error: any) {
      console.error('=== APPROVAL ERROR ===', error);
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

      // Always verify current on-chain allowance before swapping
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

      // CRITICAL FIX: Estimate gas before executing swap
      let estimatedGas: bigint;
      console.log('Estimating gas for swap...', { functionName, amountIn: amountIn.toString(), minOutputAmount: minOutputAmount.toString() });
      try {
        estimatedGas = await publicClient.estimateContractGas({
          address: CONTRACTS.simpleDex as `0x${string}`,
          abi: SIMPLE_DEX_ABI,
          functionName,
          args: [amountIn, minOutputAmount, deadline],
          account: userAddress,
        });
        
        // Add 30% buffer for safety (Arc Testnet can be unpredictable)
        estimatedGas = (estimatedGas * BigInt(130)) / BigInt(100);
        
        console.log('=== SWAP GAS ESTIMATION ===');
        console.log('Estimated gas:', estimatedGas.toString());
        console.log('Function:', functionName);
        console.log('Amount in:', amountIn.toString());
        console.log('Min out:', minOutputAmount.toString());
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        // Fallback gas limit - high enough for most swaps
        estimatedGas = BigInt(800000);
        console.log('Using fallback gas:', estimatedGas.toString());
      }

      // Execute swap with estimated gas
      console.log('Executing swap with gasLimit:', estimatedGas.toString());

      const hash = await walletClient.writeContract({
        address: CONTRACTS.simpleDex as `0x${string}`,
        abi: SIMPLE_DEX_ABI,
        functionName,
        args: [amountIn, minOutputAmount, deadline],
        gas: estimatedGas,
      });

      console.log('=== SWAP TRANSACTION SENT ===', hash);

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
      
      console.log('=== SWAP RECEIPT ===', receipt);

      if (receipt.status === 'reverted') {
        updateTransactionStatus(userAddress, hash, 'failed');
        setState(prev => ({ 
          ...prev, 
          isSwapping: false, 
          error: 'Transaction failed. Check slippage or try reducing amount.' 
        }));
        throw new Error('Transaction reverted');
      }

      updateTransactionStatus(userAddress, hash, 'success');
      setState(prev => ({ ...prev, isSwapping: false, error: null, txHash: hash }));
      return hash;
    } catch (error: any) {
      console.error('=== SWAP ERROR ===', error);
      let errorMsg = 'Swap failed';
      
      if (error.message?.includes('user rejected') || error.message?.includes('User denied')) {
        errorMsg = 'Transaction cancelled by user';
      } else if (error.message?.includes('gas')) {
        errorMsg = 'Transaction failed: insufficient gas. Try again or contact support.';
      } else if (error.message?.includes('insufficient') || error.message?.includes('Insufficient')) {
        errorMsg = 'Insufficient balance or liquidity';
      } else if (error.message?.includes('expired') || error.message?.includes('Deadline')) {
        errorMsg = 'Transaction deadline expired';
      } else if (error.message?.includes('Slippage') || error.message?.includes('slippage')) {
        errorMsg = 'Slippage tolerance exceeded. Try increasing slippage.';
      } else if (error.shortMessage) {
        errorMsg = error.shortMessage;
      }
      
      setState(prev => ({ ...prev, isSwapping: false, error: errorMsg, txHash: null }));
      throw error;
    }
  }, [walletClient, publicClient, fromToken, toToken, userAddress, amount, outputAmount, minOutputAmount, approve]);

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