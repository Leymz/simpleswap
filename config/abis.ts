// ERC20 ABI - proper typed format for viem
export const ERC20_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// SimpleDEX ABI - UPDATED with security features (deadline, slippage protection)
export const SIMPLE_DEX_ABI = [
  // View functions
  {
    inputs: [],
    name: 'reserveUSDC',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'reserveEURC',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalLiquidity',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'liquidityBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MINIMUM_LIQUIDITY',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'reserveIn', type: 'uint256' },
      { name: 'reserveOut', type: 'uint256' },
    ],
    name: 'getAmountOut',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getExchangeRate',
    outputs: [
      { name: 'usdcPerEurc', type: 'uint256' },
      { name: 'eurcPerUsdc', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'eurcAmount', type: 'uint256' },
    ],
    name: 'getAddLiquidityQuote',
    outputs: [{ name: 'liquidityMinted', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'liquidityAmount', type: 'uint256' }],
    name: 'getRemoveLiquidityQuote',
    outputs: [
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'eurcAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // State changing functions - UPDATED with deadline and slippage
  {
    inputs: [
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'minEurcOut', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }, // ✅ NEW
    ],
    name: 'swapUSDCForEURC',
    outputs: [{ name: 'eurcOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'eurcAmount', type: 'uint256' },
      { name: 'minUsdcOut', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }, // ✅ NEW
    ],
    name: 'swapEURCForUSDC',
    outputs: [{ name: 'usdcOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'eurcAmount', type: 'uint256' },
      { name: 'minLiquidity', type: 'uint256' }, // ✅ NEW
      { name: 'deadline', type: 'uint256' }, // ✅ NEW
    ],
    name: 'addLiquidity',
    outputs: [{ name: 'liquidityMinted', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'liquidityAmount', type: 'uint256' },
      { name: 'minUsdcOut', type: 'uint256' }, // ✅ NEW
      { name: 'minEurcOut', type: 'uint256' }, // ✅ NEW
      { name: 'deadline', type: 'uint256' }, // ✅ NEW
    ],
    name: 'removeLiquidity',
    outputs: [
      { name: 'usdcAmount', type: 'uint256' },
      { name: 'eurcAmount', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'sync',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

// Curve StableSwap Pool ABI - for swapping via Curve
export const CURVE_POOL_ABI = [
  // Get expected output for a swap
  {
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
    ],
    name: 'get_dy',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Execute a swap
  {
    inputs: [
      { name: 'i', type: 'int128' },
      { name: 'j', type: 'int128' },
      { name: 'dx', type: 'uint256' },
      { name: 'min_dy', type: 'uint256' },
    ],
    name: 'exchange',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Get coin address at index
  {
    inputs: [{ name: 'i', type: 'uint256' }],
    name: 'coins',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Get pool balances
  {
    inputs: [{ name: 'i', type: 'uint256' }],
    name: 'balances',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Get amplification coefficient
  {
    inputs: [],
    name: 'A',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Get fee
  {
    inputs: [],
    name: 'fee',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
