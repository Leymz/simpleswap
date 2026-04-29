import '@/styles/globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/config/wagmi';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: '#8b5cf6',
              accentColorForeground: 'white',
              borderRadius: 'large',
              fontStack: 'system',
              overlayBlur: 'small',
            })}
            modalSize="compact"
          >
            <Component {...pageProps} />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
  );
}