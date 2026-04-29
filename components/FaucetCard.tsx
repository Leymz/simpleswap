export default function FaucetCard() {
  return (
    <div className="w-full max-w-md mx-auto glass-card rounded-2xl p-6 sm:p-8 text-center animate-slideUp">
      {/* Icon */}
      <div className="text-6xl mb-6">💧</div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-white mb-3">
        Get Testnet Tokens
      </h2>

      {/* Description */}
      <p className="text-gray-400 mb-6 leading-relaxed">
        Get free USDC and EURC tokens on Arc Testnet from Circle&apos;s official faucet to test swaps.
      </p>

      {/* Faucet Link */}
      <a
        href="https://faucet.circle.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-4 btn-primary rounded-full text-lg font-semibold mb-8"
      >
        Open Circle Faucet
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      {/* Instructions */}
      <div className="space-y-3 text-left border-t border-primary-600/30 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">How to get tokens:</h3>
        
        <div className="flex items-start gap-3 text-sm">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center text-xs font-bold">1</span>
          <p className="text-gray-400">Open the Circle Faucet link above</p>
        </div>
        
        <div className="flex items-start gap-3 text-sm">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center text-xs font-bold">2</span>
          <p className="text-gray-400">Select <strong className="text-white">Arc Testnet</strong> as the network</p>
        </div>
        
        <div className="flex items-start gap-3 text-sm">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center text-xs font-bold">3</span>
          <p className="text-gray-400">Enter your wallet address and request <strong className="text-white">USDC</strong> or <strong className="text-white">EURC</strong></p>
        </div>
        
        <div className="flex items-start gap-3 text-sm">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-purple/20 text-accent-purple flex items-center justify-center text-xs font-bold">4</span>
          <p className="text-gray-400">Wait a few seconds for tokens to arrive</p>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-primary-900/50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <svg className="w-4 h-4 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>You can request up to 20 USDC every 2 hours per address</span>
        </div>
      </div>
    </div>
  );
}
