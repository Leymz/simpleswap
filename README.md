# Simple Swap

A DEX swap frontend for Arc Testnet built with Next.js, React, and RainbowKit.

## Features

- 🌈 **RainbowKit** wallet connection (MetaMask, WalletConnect, Coinbase, etc.)
- 💱 **Token Swaps** via ArcFlow Finance V2.5 Router
- 💰 **Real-time balances** and price quotes
- ⚙️ **Configurable slippage** tolerance
- 📱 **Fully responsive** design
- 🎨 **Dark blue/purple** theme

## Supported Tokens

| Token | Address |
|-------|---------|
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |
| USYC | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

### 3. Open browser

Go to [http://localhost:3000](http://localhost:3000)

## Getting Testnet Tokens

1. Go to the **Faucet** tab in the app
2. Click "Open Circle Faucet"
3. Select **Arc Testnet**
4. Request USDC and/or EURC

## Tech Stack

- **Next.js 14** - React framework
- **RainbowKit** - Wallet connection
- **wagmi** - React hooks for Ethereum
- **viem** - Ethereum library
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

## Contract Addresses

| Contract | Address |
|----------|---------|
| ArcFlow Router | `0x4AA8c7Ac458479d9A4FA5c1481e03061ac76824A` |
| USDC/EURC Pair | `0xFA61E1dE61DAf2EF4D8d9BAd4B99fa21C8EFAB8a` |

## Project Structure

```
simple-swap/
├── components/
│   ├── Header.tsx          # Navigation & wallet button
│   ├── SwapCard.tsx        # Main swap interface
│   ├── TokenSelector.tsx   # Token selection modal
│   ├── SettingsModal.tsx   # Slippage settings
│   └── FaucetCard.tsx      # Faucet instructions
├── config/
│   ├── wagmi.ts           # RainbowKit & chain config
│   ├── tokens.ts          # Token list
│   └── abis.ts            # Contract ABIs
├── hooks/
│   ├── useTokenBalance.ts # Balance hook
│   └── useSwap.ts         # Swap functionality
├── pages/
│   ├── _app.tsx           # App wrapper with providers
│   └── index.tsx          # Main page
└── styles/
    └── globals.css        # Global styles
```

## Network Config

| Setting | Value |
|---------|-------|
| Network | Arc Testnet |
| Chain ID | 5042002 |
| RPC URL | https://rpc.testnet.arc.network |
| Explorer | https://testnet.arcscan.app |
| Native Currency | USDC |

## License

MIT
