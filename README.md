# Multi-Asset Converter & Bridge

A modern, responsive single-page React application built with Next.js and TypeScript for converting between USD and multiple ERC-20 tokens across EVM chains, with simulated bridge transaction capabilities. The application demonstrates strong React/TypeScript fundamentals, asynchronous operations, error handling, Web3 concepts, state management, and production-grade UX patterns.

## Features

### Phase 1 (Core Conversion)
- **Real-time Currency Conversion**: Convert between USD and wBTC using live Bitcoin prices from CoinGecko API
- **Wallet Integration**: Connect with MetaMask, WalletConnect, or other injected wallets using wagmi v3
- **Network Awareness**: Automatic detection and warnings for incorrect blockchain networks
- **Input Validation**: Smart validation for USD (max 2 decimals) and wBTC (max 8 decimals)
- **Real-time Updates**: Instant conversion as you type, no button clicks required
- **Responsive Design**: Fully responsive layout optimized for desktop and mobile devices
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, and proper contrast ratios
- **Error Handling**: Comprehensive error messages for API failures, network issues, and invalid inputs
- **wBTC Balance Display**: View your wBTC balance when connected to Ethereum Mainnet

### Phase 2 (Network Resilience & Multi-Asset)
- **Network Resilience UX**: Multi-connector support (MetaMask, WalletConnect) with connector selector and chain status badges
- **Multi-Chain Support**: Support for Ethereum Mainnet, Sepolia Testnet, Polygon, and Arbitrum with unsupported chain detection
- **Connector Persistence**: Automatic restoration of connector and chain preferences using localStorage
- **Simulated Bridge Transactions**: Mock bridge transaction flow with progress stepper, retry mechanism, and state machine
- **Multi-Asset Support**: Convert between USD and multiple ERC-20 tokens (wBTC, USDC, DAI) across different EVM chains
- **Asset-Chain Selection**: Combined asset and chain selector for flexible token selection
- **Price Caching**: TanStack Query-based caching for token prices with 1-minute stale time
- **Token Balance Display**: Real-time token balance display for connected wallets
- **Contract Address Detection**: Validation to prevent sending to contract addresses instead of wallet addresses

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**, **yarn**, **pnpm**, or **bun**: Package manager of your choice
- **Git**: For cloning the repository
- **Web3 Wallet** (optional, for testing): MetaMask or compatible wallet extension

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/thepreakerebi/converter.git
cd converter
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using pnpm:
```bash
pnpm install
```

Using bun:
```bash
bun install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

**Optional Environment Variables:**

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect Project ID (optional, for WalletConnect support)
  - Get one at [WalletConnect Cloud](https://cloud.walletconnect.com/)
  - If not provided, WalletConnect connector will be disabled

Example `.env.local`:
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

> **Note**: The application works without WalletConnect. MetaMask and other injected wallets will still function.

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

The page will automatically reload when you make changes to the code.

### Production Build

Build the application for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The production build will be optimized and ready for deployment.

## Testing

This project uses [Vitest](https://vitest.dev/) as the test runner with [React Testing Library](https://testing-library.com/react) for component testing.

### Run Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (recommended for development):
```bash
npm test -- --watch
```

### Test UI

Open the Vitest UI for a visual test interface:
```bash
npm run test:ui
```

### Test Coverage

Generate and view test coverage:
```bash
npm run test:coverage
```

### Writing Tests

All tests are located in the `__tests__` directory at the root of the project, organized by category:

**Test Structure:**
```
__tests__/
├── lib/
│   ├── conversion.test.ts          # Tests for conversion utilities
│   └── wbtc-contract.test.ts       # Tests for wBTC contract configuration
└── components/
    ├── conversionResult.test.tsx   # Tests for ConversionResult component
    ├── conversionCard.test.tsx     # Tests for ConversionCard component
    └── walletInfoBar.test.tsx      # Tests for WalletInfoBar component
```

**Test Files:**
- `__tests__/lib/conversion.test.ts` - Tests for conversion utilities (fetchBitcoinPrice, usdToWbtc, wbtcToUsd, formatting, validation)
- `__tests__/lib/wbtc-contract.test.ts` - Tests for wBTC contract configuration
- `__tests__/components/conversionResult.test.tsx` - Tests for ConversionResult component
- `__tests__/components/conversionCard.test.tsx` - Tests for ConversionCard component (with wagmi mocks)
- `__tests__/components/walletInfoBar.test.tsx` - Tests for WalletInfoBar component (with wagmi mocks)

**Example test structure:**

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversionCard } from '../../app/_components/conversionCard'

describe('ConversionCard', () => {
  it('renders correctly', () => {
    render(<ConversionCard />)
    expect(screen.getByText(/Convert to/i)).toBeInTheDocument()
  })
})
```

**Mocking Web3 Hooks:**

For components using wagmi hooks, tests use mocked versions:

```typescript
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: vi.fn(() => []),
    useChainId: vi.fn(() => 1),
    useReadContract: vi.fn(() => ({ data: undefined, isLoading: false })),
  }
})
```

## Code Quality

### Linting

Check for linting errors:
```bash
npm run lint
```

The project uses ESLint with Next.js configuration and Prettier integration.

### Formatting

Format all files with Prettier:
```bash
npm run format
```

Check formatting without making changes:
```bash
npm run format:check
```

## Project Structure

```
converter/
├── app/                          # Next.js app directory
│   ├── _components/             # App-specific components
│   │   ├── conversionCard.tsx   # Main conversion interface
│   │   ├── conversionResult.tsx # Conversion result display
│   │   ├── walletInfoBar.tsx    # Wallet connection header
│   │   ├── connectorSelector.tsx # Connector selection dropdown
│   │   ├── chainStatusBadge.tsx # Chain status display
│   │   ├── assetChainSelector.tsx # Asset-chain selection
│   │   ├── bridgeForm.tsx       # Bridge transaction form
│   │   └── bridgeProgress.tsx    # Bridge progress stepper
│   ├── api/                     # API routes
│   │   └── bridge/              # Bridge API endpoint
│   │       └── route.ts         # Mock bridge transaction handler
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # Reusable UI components
│   ├── providers/              # React context providers
│   │   └── providers.tsx       # Wagmi & React Query providers
│   └── ui/                     # Shadcn UI components
├── lib/                         # Utility functions and configs
│   ├── conversion.ts           # Conversion logic & API calls
│   ├── wagmi.config.ts         # Wagmi configuration
│   ├── wbtc-contract.ts        # wBTC contract ABI & config
│   ├── assets-config.ts        # Multi-asset metadata configuration
│   ├── bridge-state-machine.ts  # Bridge transaction state machine
│   ├── bridge-schema.ts        # Bridge form validation schema
│   ├── storage.ts              # localStorage utilities
│   └── utils.ts                # Utility functions
├── hooks/                       # Custom React hooks
│   ├── useWalletStatus.ts      # Wallet status & chain detection
│   ├── useTokenPrices.ts       # Token price fetching with caching
│   └── useBridgeTransaction.ts # Bridge transaction state management
├── docs/                        # Documentation
│   ├── phase2-rationale.md     # Architecture & design decisions
│   ├── bridge-state.md         # Bridge state machine diagram
│   └── manual-tests.md         # Manual QA test cases
├── __tests__/                   # Test files
│   ├── hooks/                  # Hook tests
│   ├── integration/            # Integration tests
│   ├── components/             # Component tests
│   └── mocks/                  # MSW handlers
├── public/                      # Static assets
├── vitest.config.ts            # Vitest configuration
├── vitest.setup.ts             # Vitest setup file
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
└── package.json                # Dependencies and scripts
```

## Technologies Used

### Core Framework
- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript

### Web3 Integration
- **wagmi v3**: React hooks for Ethereum
- **viem**: TypeScript Ethereum library
- **@wagmi/connectors**: Wallet connectors (MetaMask, WalletConnect, Injected)

**Why wagmi + viem instead of ethers.js or web3.js?**

I chose **wagmi** and **viem** over alternatives like **ethers.js** or **web3.js** for several key reasons:

1. **Modern TypeScript-First Design**: 
   - **viem** is built from the ground up with TypeScript, providing superior type safety and developer experience
   - **ethers.js** and **web3.js** were originally JavaScript libraries with TypeScript added later, leading to less comprehensive type coverage

2. **React-Optimized Architecture**:
   - **wagmi** provides React hooks that integrate seamlessly with React's component lifecycle and state management
   - Built-in support for React Query, automatic cache management, and optimistic updates
   - **ethers.js** and **web3.js** require manual state management and don't have native React integration

3. **Better Performance**:
   - **viem** uses modern ESM and tree-shaking, resulting in smaller bundle sizes
   - More efficient RPC calls and built-in request batching
   - **ethers.js** can be heavier and less optimized for modern bundlers

4. **Superior Developer Experience**:
   - **wagmi** handles wallet connection state, network switching, and account management automatically
   - Built-in SSR support with Next.js App Router
   - Simplified API with fewer boilerplate code requirements
   - **ethers.js** requires more manual setup and configuration

5. **Active Development & Future-Proof**:
   - **wagmi** and **viem** are actively maintained with regular updates and modern best practices
   - Better alignment with the latest Ethereum standards and EIPs
   - Strong community support and comprehensive documentation

6. **Next.js Integration**:
   - Native support for Next.js App Router and Server Components
   - Built-in cookie-based storage for SSR hydration
   - Seamless integration with React Query for data fetching

While **ethers.js** and **web3.js** are mature and widely used, **wagmi + viem** provide a more modern, type-safe, and React-friendly approach that aligns better with current best practices and Next.js development patterns.

### UI & Styling
- **Tailwind CSS 4**: Utility-first CSS framework
- **Shadcn UI**: High-quality React components
- **Lucide React**: Icon library
- **Rethink Sans**: Custom font family

### Data Fetching
- **@tanstack/react-query**: Server state management
- **CoinGecko API**: Real-time Bitcoin price data

### Testing
- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers

### Code Quality
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Wallet Connection Setup

### Supported Wallets

The application supports multiple wallet connection methods:

1. **MetaMask**: Most popular Ethereum wallet
2. **WalletConnect**: Connect via QR code (requires Project ID)
3. **Injected Wallets**: Any wallet that injects into the browser

### Connecting Your Wallet

1. **Install a Wallet**: If you don't have one, install [MetaMask](https://metamask.io/)
2. **Switch to Ethereum Mainnet**: Ensure your wallet is connected to Ethereum Mainnet (Chain ID: 1)
3. **Click "Connect Wallet"**: Click the button in the header to connect
4. **Approve Connection**: Approve the connection request in your wallet

### Network Requirements

- **Required Network**: Ethereum Mainnet (Chain ID: 1)
- **wBTC Contract**: `0x2260fac5e5542a773aa44fbcfedf7c193bc2c599`

The application will display warnings if:
- Wallet is not connected
- Connected to wrong network (not Ethereum Mainnet)
- Connected to non-EVM chain (e.g., Solana)

## Usage Guide

### Converting USD to wBTC

1. Ensure your wallet is connected to Ethereum Mainnet
2. The input field defaults to USD mode
3. Enter the USD amount (maximum 2 decimal places)
4. The conversion happens automatically as you type
5. View the converted wBTC amount below the input field

### Converting wBTC to USD

1. Click the toggle button (↔️) next to the input field
2. The input switches to wBTC mode
3. Enter the wBTC amount (maximum 8 decimal places)
4. The conversion happens automatically as you type
5. View the converted USD amount below the input field

### Clearing Input

- Click the **X** button inside the input field to clear the value
- Or manually delete the text

### Viewing wBTC Balance

- Your wBTC balance appears in the header when:
  - Wallet is connected
  - Connected to Ethereum Mainnet
  - You have wBTC tokens in your wallet

## API Integration

### CoinGecko API

The application fetches real-time Bitcoin prices from CoinGecko:

- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- **Rate Limiting**: Free tier allows 10-50 calls/minute
- **Error Handling**: Graceful fallback with error messages

### Ethereum Mainnet

- **RPC**: Uses public RPC endpoints via viem
- **wBTC Contract**: Reads symbol and decimals from the contract
- **Balance**: Fetches user's wBTC balance when connected

## Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet doesn't connect
- **Solution**: Ensure MetaMask or your wallet extension is installed and unlocked
- **Solution**: Try refreshing the page
- **Solution**: Check browser console for errors

**Problem**: "Wrong Network" error
- **Solution**: Switch your wallet to Ethereum Mainnet
- **Solution**: Use MetaMask's network switcher to change networks

**Problem**: "Unsupported network" error
- **Solution**: The application only supports Ethereum Mainnet
- **Solution**: Ensure you're not connected to Solana or other non-EVM chains

### API Issues

**Problem**: "Failed to fetch Bitcoin price"
- **Solution**: Check your internet connection
- **Solution**: CoinGecko API might be temporarily unavailable
- **Solution**: Wait a moment and try again

**Problem**: Conversion not working
- **Solution**: Ensure wallet is connected to Ethereum Mainnet
- **Solution**: Check that BTC price loaded successfully
- **Solution**: Verify input format (correct decimal places)

### Build Issues

**Problem**: Build fails with TypeScript errors
- **Solution**: Run `npm install` to ensure all dependencies are installed
- **Solution**: Check `tsconfig.json` configuration
- **Solution**: Ensure Node.js version is 18.x or higher

**Problem**: Module not found errors
- **Solution**: Delete `node_modules` and `package-lock.json`
- **Solution**: Run `npm install` again
- **Solution**: Check that all dependencies are listed in `package.json`

## Development Tips

### Hot Reload

The development server supports hot module replacement (HMR). Changes to components will automatically update in the browser.

### TypeScript

- All components are written in TypeScript
- Type definitions are available for all dependencies
- Use `tsc --noEmit` to check types without building

### Component Development

- Components are located in `app/_components/` for app-specific components
- Reusable UI components are in `components/ui/`
- Follow the existing component patterns for consistency

### Styling

- Use Tailwind CSS utility classes
- Follow the design system established by Shadcn UI
- Custom styles go in `app/globals.css`

## Deployment

### Vercel (Recommended)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Supports Next.js out of the box
- **AWS Amplify**: Full Next.js support
- **Railway**: Easy deployment with environment variables
- **Docker**: Build a containerized version
- **Vercel**: Full Next.js support

### Environment Variables

Remember to set environment variables in your deployment platform:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests
5. Run linting and formatting (`npm run lint && npm run format`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues, questions, or contributions, please open an issue in the [repository](https://github.com/thepreakerebi/converter).

---

**Built with ❤️ using Next.js, React, TypeScript, and Web3 technologies**
