export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
  isNative?: boolean;
  priceUSD?: number;
}

// All tokens available on Arc Testnet
// Reference: https://docs.arc.network/arc/references/contract-addresses
export const TOKENS: Record<string, Token> = {
  USDC: {
    address: '0x3600000000000000000000000000000000000000',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://www.circle.com/hubfs/Brand/USDC/USDC_icon_32x32.png',
    isNative: true, // USDC is the native gas token on Arc
    priceUSD: 1.00,
  },
  EURC: {
    address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    logoURI: 'https://www.circle.com/hubfs/Brand/EURC/EURC-icon_32x32.png',
    isNative: false, // ERC20 token
    priceUSD: 1.08,
  },
  USYC: {
    address: '0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C',
    symbol: 'USYC',
    name: 'US Yield Coin',
    decimals: 6,
    logoURI: 'https://www.circle.com/hubfs/Brand/USDC/USDC_icon_32x32.png',
    isNative: false, // ERC20 token
    priceUSD: 1.00,
  },
};

// Token list as array
export const TOKEN_LIST: Token[] = Object.values(TOKENS);

// Get token by address
export const getTokenByAddress = (address: string): Token | undefined => {
  return TOKEN_LIST.find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
};

// Get token by symbol
export const getTokenBySymbol = (symbol: string): Token | undefined => {
  return TOKENS[symbol.toUpperCase()];
};

// Format token amount
export const formatTokenAmount = (
  amount: string | number,
  decimals: number = 6
): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) return '0.00';
  if (num < 0.000001) return '<0.000001';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  if (num >= 1) {
    return num.toFixed(4);
  }
  return num.toFixed(6);
};

// Format USD value
export const formatUsdValue = (amount: number): string => {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return '<$0.01';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
