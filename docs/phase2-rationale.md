# Phase 2 Implementation Rationale

## Architecture Overview

Phase 2 extends the Phase 1 wBTC converter with three major features: Network Resilience UX, Simulated Bridge Transaction, and Multi-Asset Support. The architecture follows a component-based structure with custom hooks for state management, centralized configuration files for metadata, and a reducer-based state machine for complex transaction flows.

### Component Structure

The application is organized into:
- **App Components** (`app/_components/`): Feature-specific components like `ConversionCard`, `BridgeForm`, `BridgeProgress`, `ConnectorSelector`, `ChainStatusBadge`, and `AssetChainSelector`
- **Custom Hooks** (`hooks/`): Reusable logic hooks (`useWalletStatus`, `useTokenPrices`, `useBridgeTransaction`)
- **Configuration** (`lib/`): Centralized metadata (`assets-config.ts`), state machine (`bridge-state-machine.ts`), validation schemas (`bridge-schema.ts`), and Wagmi config
- **API Routes** (`app/api/`): Mock bridge endpoint for simulating transactions

### State Management Approach

**useReducer vs XState**: We chose `useReducer` over XState for the bridge state machine for several reasons:

1. **Simplicity**: The bridge flow has a linear progression (idle → validating → submitting → pending → confirmed) with clear error paths. `useReducer` provides sufficient structure without the overhead of a full state machine library.

2. **Bundle Size**: XState adds significant bundle weight (~50KB+), while `useReducer` is built into React with zero additional dependencies.

3. **Type Safety**: TypeScript discriminated unions (`BridgeState`) provide excellent type safety and autocomplete without external tooling.

4. **Maintainability**: The reducer pattern is familiar to React developers and integrates seamlessly with React's lifecycle. The state machine logic is contained in a single reducer function, making it easy to understand and modify.

5. **Testing**: Reducers are pure functions, making them trivial to test without mocking complex state machine internals.

The bridge state machine manages seven states: `idle`, `validating`, `submitting`, `pending`, `confirmed`, `failed`, and `retrying`. Each state transition is explicit and type-safe, ensuring predictable behavior.

### Hook Design Patterns

All custom hooks follow a consistent pattern:
- **Single Responsibility**: Each hook manages one domain (wallet status, token prices, bridge transactions)
- **Return Type Interfaces**: Explicit return types (`UseWalletStatusReturn`, `UseTokenPricesReturn`, `UseBridgeTransactionReturn`) for better IDE support and documentation
- **Error Handling**: Errors are returned in the hook's return value rather than thrown, allowing components to handle them gracefully
- **Memoization**: Expensive computations are memoized using `useMemo` and `useCallback` to prevent unnecessary re-renders

## Trade-offs & Decisions

### localStorage vs sessionStorage

We chose `localStorage` over `sessionStorage` for persisting connector and chain preferences because:
- **User Experience**: Users expect their wallet preferences to persist across browser sessions
- **Convenience**: Not having to reconnect on every page refresh improves UX
- **Security**: Stored preferences (connector ID, chain ID) are not sensitive data; they're just UX preferences

The trade-off is that preferences persist even after closing the browser, but this aligns with user expectations for wallet applications.

### TanStack Query Caching Strategy

For token price fetching, we use TanStack Query with the following configuration:
- **staleTime: 60,000ms (1 minute)**: Prices are considered fresh for 1 minute, preventing unnecessary refetches during rapid component re-renders
- **gcTime: 300,000ms (5 minutes)**: Cached data is kept in memory for 5 minutes after components unmount, allowing instant display when remounting
- **refetchOnWindowFocus: false**: Prevents refetching when users switch browser tabs, reducing API calls
- **refetchOnMount: true**: Ensures fresh data when components mount if cache is stale

This strategy balances freshness with performance, reducing CoinGecko API calls while ensuring users see reasonably up-to-date prices. The 1-minute stale time is appropriate for cryptocurrency prices, which don't change dramatically within seconds.

### Mock API Approach

The bridge transaction uses a mock API route (`/api/bridge`) that simulates:
- **Latency**: 1-3 second delays to mimic real network conditions
- **Random Success/Failure**: 70% success rate, 30% failure rate to test error handling
- **Transaction IDs**: Mock transaction hashes for successful transactions

This approach allows us to:
- Test the complete user flow without real bridge contracts
- Simulate error scenarios for robust error handling
- Develop and test the UI independently of blockchain infrastructure
- Avoid gas costs and testnet complexity during development

The trade-off is that this doesn't test real contract interactions, but that's explicitly out of scope for this assessment.

## Caching Strategy

### Token Price Caching

Token prices are cached using TanStack Query with a multi-id endpoint strategy. When multiple assets are selected, we fetch all prices in a single API call (`/api/v3/simple/price?ids=wrapped-bitcoin,usd-coin,dai&vs_currencies=usd`), reducing network requests.

The cache key includes the asset IDs (`['tokenPrices', idsParam]`), so different asset combinations have separate cache entries. This allows:
- Independent cache invalidation per asset combination
- Efficient cache hits when the same assets are requested
- Background refetching when cache becomes stale

### Balance Caching

Wallet balances are fetched using wagmi's `useReadContract` hook, which integrates with React Query under the hood. Wagmi handles caching automatically, but we don't explicitly configure cache times since balances change frequently and should be relatively fresh.

## Testing Approach

### MSW (Mock Service Worker) Setup

We use MSW to mock both the bridge API and CoinGecko API in tests. This allows:
- **Isolated Tests**: Tests don't depend on external services
- **Deterministic Results**: We control API responses for consistent test outcomes
- **Error Scenarios**: Easy to test error paths by mocking failure responses
- **Network Simulation**: Can simulate latency and network errors

MSW handlers are configured in `__tests__/mocks/handlers.ts` and set up globally in `vitest.setup.ts`.

### Integration Test Strategy

Integration tests verify complete user flows:
- **Network Resilience**: Tests connector selection, chain detection, and unsupported chain handling
- **Bridge Transaction**: Tests form submission, API calls, state transitions, retry logic, and reset functionality
- **Multi-Asset**: Tests asset selection, price fetching, conversion logic, and unsupported combinations

These tests use React Testing Library's `render` and `userEvent` to simulate real user interactions, ensuring the UI behaves correctly end-to-end.

### Hook Testing Patterns

Custom hooks are tested using `renderHook` from `@testing-library/react`. We mock dependencies (wagmi hooks, TanStack Query) and verify:
- Return values match expected types
- State transitions occur correctly
- Side effects (localStorage, API calls) execute as expected
- Error handling works correctly

## Custom Hooks API Documentation

### useWalletStatus

**Purpose**: Centralizes wallet connection status, chain detection, and connector management.

**API**:
```typescript
interface UseWalletStatusReturn {
  isConnected: boolean
  connector: Connector | null
  chainId: number | undefined
  isSupportedChain: boolean
  supportedChains: readonly Chain[]
  currentChain: Chain | null
  retryDetection: () => void
  selectConnector: (connectorId: string) => void
}
```

**Usage**: Provides wallet state and utilities for components that need to check connection status or chain support.

### useTokenPrices

**Purpose**: Fetches and caches token prices using TanStack Query.

**API**:
```typescript
interface UseTokenPricesReturn {
  prices: Record<string, number>
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

useTokenPrices(assetIds: string[]): UseTokenPricesReturn
```

**Usage**: Pass an array of CoinGecko IDs (e.g., `['wrapped-bitcoin', 'usd-coin']`) to fetch prices. Prices are cached and shared across components using the same asset IDs.

### useBridgeTransaction

**Purpose**: Manages bridge transaction state and API calls using a reducer-based state machine.

**API**:
```typescript
interface UseBridgeTransactionReturn {
  state: BridgeState
  submitTransaction: (data: BridgeFormData) => Promise<void>
  retryTransaction: () => Promise<void>
  resetTransaction: () => void
  isSubmitting: boolean
  canRetry: boolean
  error: string | null
}
```

**Usage**: Call `submitTransaction` with validated form data. The hook handles validation, API calls, and state transitions. Use `state.status` to determine current state and render appropriate UI.

