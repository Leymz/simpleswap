import { useState } from 'react';

interface TokenIconProps {
  symbol: string;
  logoURI?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Fallback icons as data URIs (always available)
const FALLBACK_ICONS: Record<string, string> = {
  USDC: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMyNzc1Q0EiLz48cGF0aCBkPSJNMjEuMiAxOC4yYzAtMi40LTEuNC0zLjItNC4yLTMuNmwtMi0uMmMtMS44LS4yLTIuMi0uNi0yLjItMS40czEtMS40IDIuNi0xLjRjMS40IDAgMi40LjQgMi42IDEuNGguMmwyLS4yYy0uNC0xLjYtMS42LTIuNC0zLjQtMi42VjhoLTEuNnYyLjJjLTIuMi4yLTMuNiAxLjQtMy42IDMuMnMxLjQgMyA0IDMuNGwyIC4yYzIgLjIgMi40LjggMi40IDEuNnMtMS4yIDEuNi0yLjggMS42Yy0xLjggMC0yLjgtLjYtMy0yaC0uMmwtMiAuMmMuNCAxLjggMS44IDMgNCAxLjJ2Mi4yaC0uMnYtMi4yYzIuNC0uMiAzLjgtMS40IDMuOC0zLjR6IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
  EURC: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMxQTUyRkYiLz48cGF0aCBkPSJNMTggMjJoLTZsLS40LTJoNi44YzEuNiAwIDIuNi0xIDIuNi0yLjRzLTEtMi40LTIuNi0yLjRoLTIuOGwtLjQtMmg1LjZsLjQtMmgtNi44YzEtMS42IDMtMi42IDUuMi0yLjZoMS40bC40LTJoLTJjLTMuNCAwLTYuMiAyLTcuNCA1SDEwbC0uNCAyaDIuMmMwIC40LS4yLjgtLjIgMXMwIC42LjIgMUgxMGwtLjQgMmgyLjZjMS4yIDMgNCA1IDcuNCA1aDJsLS40LTJoLTEuMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
  USYC: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0QUU0OTEiLz48cGF0aCBkPSJNMjEuMiAxOC4yYzAtMi40LTEuNC0zLjItNC4yLTMuNmwtMi0uMmMtMS44LS4yLTIuMi0uNi0yLjItMS40czEtMS40IDIuNi0xLjRjMS40IDAgMi40LjQgMi42IDEuNGguMmwyLS4yYy0uNC0xLjYtMS42LTIuNC0zLjQtMi42VjhoLTEuNnYyLjJjLTIuMi4yLTMuNiAxLjQtMy42IDMuMnMxLjQgMyA0IDMuNGwyIC4yYzIgLjIgMi40LjggMi40IDEuNnMtMS4yIDEuNi0yLjggMS42Yy0xLjggMC0yLjgtLjYtMy0yaC0uMmwtMiAuMmMuNCAxLjggMS44IDMgNCAxLjJ2Mi4yaC0uMnYtMi4yYzIuNC0uMiAzLjgtMS40IDMuOC0zLjR6IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
};

// Default fallback for unknown tokens
const DEFAULT_FALLBACK = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM2Qjc0ODAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZHk9Ii4zNWVtIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSIxNHB4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+PzwvdGV4dD48L3N2Zz4=';

const SIZE_CLASSES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function TokenIcon({ symbol, logoURI, size = 'md', className = '' }: TokenIconProps) {
  const [hasError, setHasError] = useState(false);
  
  const fallbackSrc = FALLBACK_ICONS[symbol] || DEFAULT_FALLBACK;
  const sizeClass = SIZE_CLASSES[size];
  
  return (
    <img
      src={hasError ? fallbackSrc : (logoURI || fallbackSrc)}
      alt={symbol}
      className={`${sizeClass} rounded-full ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
