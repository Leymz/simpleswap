import { useState, useEffect } from 'react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay for smooth entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    // Small delay before callback for exit animation
    setTimeout(onAccept, 200);
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-lg bg-gradient-to-b from-primary-800 to-primary-900 rounded-2xl border border-primary-600/50 shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
      >
        {/* Warning Icon Header */}
        <div className="flex justify-center -mt-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Title */}
          <h2 className="text-xl font-bold text-center text-white mb-1">
            Testnet Disclaimer
          </h2>
          <p className="text-center text-yellow-500 text-sm font-medium mb-4">
            Please read before proceeding
          </p>

          {/* Disclaimer Content */}
          <div className="bg-primary-900/50 rounded-xl p-4 max-h-[50vh] overflow-y-auto custom-scrollbar space-y-4 text-sm text-gray-300 leading-relaxed">
            <p>
              This decentralized exchange (DEX) is deployed on the <span className="text-white font-semibold">Arc Testnet</span> and is intended for <span className="text-yellow-400">experimental, development, and educational purposes only</span>. It is not a production platform and should not be used for real-value transactions.
            </p>
            
            <p>
              All tokens on this network are <span className="text-white font-semibold">test assets</span> and have <span className="text-yellow-400">no real-world monetary value</span>.
            </p>

            <div className="border-l-2 border-yellow-500/50 pl-3 py-1">
              <p className="text-yellow-400/90">
                Although the platform is built to operate reliably, it may contain bugs or unexpected behavior as part of an active testing environment.
              </p>
            </div>

            <p>
              Users are encouraged to use a <span className="text-white font-semibold">separate test or burner wallet</span>. You remain responsible for the security of your wallet and private keys.
            </p>

            <p className="text-gray-400">
              The creator/developer of this platform are not liable for any loss of test tokens or issues resulting from use of this application.
            </p>
          </div>

          {/* Agreement Notice */}
          <div className="mt-4 p-3 bg-accent-purple/10 border border-accent-purple/30 rounded-xl">
            <p className="text-xs text-center text-gray-400">
              By clicking &quot;I Understand &amp; Accept&quot; below, you acknowledge that you are interacting with a <span className="text-white">test environment</span>.
            </p>
          </div>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-pink text-white font-semibold text-lg hover:shadow-lg hover:shadow-accent-purple/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            I Understand &amp; Accept
          </button>

          {/* Network Badge */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-700/50 rounded-full border border-primary-600/30">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Arc Testnet • Chain ID: 5042002</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
