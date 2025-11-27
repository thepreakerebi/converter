# Manual Testing Guide

This document provides step-by-step manual testing procedures for all Phase 2 features. Each test case includes prerequisites, steps, expected results, and success criteria.

---

## Feature 1: Network Resilience UX

### Test Case 1.1: Connector Selection (MetaMask)

**Prerequisites**:
- MetaMask extension installed and unlocked
- Browser supports injected wallets

**Steps**:
1. Open the application in a browser
2. Click the "Connect Wallet" dropdown in the header
3. Select "MetaMask" from the dropdown
4. Approve the connection request in MetaMask
5. Refresh the page

**Expected Results**:
- MetaMask connection modal appears
- After approval, wallet address appears in header
- Chain status badge shows current network
- After refresh, MetaMask is automatically selected (preference persisted)

**Success Criteria**:
- ✅ Connection succeeds without errors
- ✅ Wallet address displays correctly
- ✅ Preference persists after page refresh
- ✅ No console errors

---

### Test Case 1.2: Connector Selection (WalletConnect)

**Prerequisites**:
- WalletConnect Project ID configured in `.env.local`
- Mobile wallet app with WalletConnect support (e.g., MetaMask Mobile)

**Steps**:
1. Open the application
2. Click "Connect Wallet" dropdown
3. Select "WalletConnect"
4. Scan QR code with mobile wallet
5. Approve connection on mobile device

**Expected Results**:
- WalletConnect modal appears with QR code
- QR code is scannable
- Connection succeeds after mobile approval
- Wallet address appears in header

**Success Criteria**:
- ✅ QR code displays correctly
- ✅ Connection succeeds via mobile wallet
- ✅ Wallet address displays after connection
- ✅ Modal overlay appears above header (z-index correct)

---

### Test Case 1.3: Supported Chain Detection (Ethereum Mainnet)

**Prerequisites**:
- Wallet connected
- Wallet switched to Ethereum Mainnet

**Steps**:
1. Connect wallet (any connector)
2. Ensure wallet is on Ethereum Mainnet (Chain ID: 1)
3. Observe chain status badge

**Expected Results**:
- Chain status badge shows "Ethereum Mainnet"
- Badge has green/success styling
- No error alerts displayed

**Success Criteria**:
- ✅ Correct chain name displayed
- ✅ Badge indicates supported chain
- ✅ No warnings or errors

---

### Test Case 1.4: Supported Chain Detection (Sepolia Testnet)

**Prerequisites**:
- Wallet connected
- Wallet switched to Sepolia Testnet

**Steps**:
1. Connect wallet
2. Switch wallet to Sepolia Testnet (Chain ID: 11155111)
3. Observe chain status badge

**Expected Results**:
- Chain status badge shows "Sepolia"
- Badge has green/success styling
- No error alerts displayed

**Success Criteria**:
- ✅ Correct chain name displayed
- ✅ Badge indicates supported chain
- ✅ No warnings or errors

---

### Test Case 1.5: Unsupported Chain Detection (Polygon)

**Prerequisites**:
- Wallet connected
- Wallet supports Polygon network

**Steps**:
1. Connect wallet
2. Switch wallet to Polygon Mainnet (Chain ID: 137)
3. Observe UI

**Expected Results**:
- Chain status badge shows "Unsupported Network: Polygon"
- Badge has red/destructive styling
- Alert appears: "Polygon is not supported. Switch to Ethereum Mainnet, Sepolia, Polygon, or Arbitrum."
- Alert auto-dismisses after 10 seconds
- "Retry Detection" button appears in badge

**Success Criteria**:
- ✅ Unsupported network detected correctly
- ✅ Alert message is clear and actionable
- ✅ Alert auto-dismisses after 10 seconds
- ✅ Retry button is visible and functional

---

### Test Case 1.6: Retry Detection Functionality

**Prerequisites**:
- Wallet connected to unsupported chain (e.g., Polygon)
- Unsupported network alert visible

**Steps**:
1. Connect wallet to unsupported chain
2. Click "Retry Detection" button in chain status badge
3. Observe wallet connection state

**Expected Results**:
- Wallet disconnects
- Connection UI resets to "Connect Wallet" state
- Unsupported network alert disappears
- User can reconnect (hopefully to supported chain)

**Success Criteria**:
- ✅ Wallet disconnects cleanly
- ✅ UI resets correctly
- ✅ No errors in console
- ✅ User can reconnect

---

### Test Case 1.7: Connector Preference Persistence

**Prerequisites**:
- MetaMask or WalletConnect previously connected

**Steps**:
1. Connect wallet using MetaMask
2. Disconnect wallet
3. Close browser tab
4. Reopen application in new tab
5. Click "Connect Wallet"

**Expected Results**:
- Previously used connector (MetaMask) is remembered
- Connection flow uses saved preference
- Preference persists across browser sessions

**Success Criteria**:
- ✅ Preference saved in localStorage
- ✅ Preference persists after browser restart
- ✅ Connection uses saved preference

---

## Feature 2: Simulated Bridge Transaction

### Test Case 2.1: Bridge Form Display

**Prerequisites**:
- Wallet connected (optional, but recommended)
- Asset-chain combination selected

**Steps**:
1. Navigate to conversion card
2. Click "Bridge Tokens" button
3. Observe bridge form appearance

**Expected Results**:
- Bridge form slides down smoothly (animation)
- Form displays:
  - Source Chain (read-only, from selected asset-chain)
  - Destination Chain (dropdown)
  - Asset (read-only, from selected asset-chain)
  - Amount input field
  - Recipient Address input field
  - Estimated Fees and Time alert
  - "Bridge Tokens" submit button

**Success Criteria**:
- ✅ Form appears with smooth animation
- ✅ All form fields visible and correctly labeled
- ✅ Source chain and asset are read-only and match selection
- ✅ Form is accessible (keyboard navigation works)

---

### Test Case 2.2: Form Validation - Empty Fields

**Prerequisites**:
- Bridge form visible
- No fields filled

**Steps**:
1. Open bridge form
2. Click "Bridge Tokens" submit button without filling fields
3. Observe validation errors

**Expected Results**:
- Submit button is disabled or shows validation errors
- Inline error messages appear for required fields:
  - "Amount is required"
  - "Recipient address is required"
  - "Destination chain is required"

**Success Criteria**:
- ✅ Validation errors display correctly
- ✅ Submit is blocked until fields are valid
- ✅ Error messages are clear and actionable

---

### Test Case 2.3: Form Validation - Invalid Amount

**Prerequisites**:
- Bridge form visible

**Steps**:
1. Enter invalid amount (e.g., "abc", "-5", "0")
2. Observe validation

**Expected Results**:
- Error message: "Amount must be a positive number"
- Submit button disabled

**Success Criteria**:
- ✅ Invalid amounts rejected
- ✅ Error message is clear
- ✅ Submit blocked

---

### Test Case 2.4: Form Validation - Invalid Recipient Address

**Prerequisites**:
- Bridge form visible

**Steps**:
1. Enter invalid Ethereum address (e.g., "0x123", "not-an-address")
2. Observe validation

**Expected Results**:
- Error message: "Recipient address must be a valid Ethereum address"
- Submit button disabled

**Success Criteria**:
- ✅ Invalid addresses rejected
- ✅ Error message explains requirement
- ✅ Submit blocked

---

### Test Case 2.5: Contract Address Detection

**Prerequisites**:
- Bridge form visible
- Valid Ethereum address format

**Steps**:
1. Enter a contract address (e.g., USDC contract: `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`)
2. Wait for validation (debounced ~500ms)
3. Observe error

**Expected Results**:
- "Checking address..." message appears briefly
- Error alert: "Recipient address is a contract address. Please use a wallet address (EOA) instead."
- Submit button disabled

**Success Criteria**:
- ✅ Contract addresses detected
- ✅ Clear error message
- ✅ Submit blocked for contract addresses
- ✅ Validation is debounced (not too frequent)

---

### Test Case 2.6: Successful Bridge Transaction

**Prerequisites**:
- Bridge form visible
- Valid form data entered

**Steps**:
1. Fill bridge form:
   - Amount: "0.1"
   - Recipient Address: Valid EOA address (e.g., `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`)
   - Destination Chain: Select from dropdown
2. Click "Bridge Tokens"
3. Observe progress stepper

**Expected Results**:
- Submit button disappears
- Progress stepper appears with 4 steps:
  1. Validating (active, spinner)
  2. Submitting (inactive)
  3. Pending (inactive)
  4. Confirmed (inactive)
- After ~1-3 seconds:
  - Step 1 completes (checkmark)
  - Step 2 becomes active (spinner)
- After ~2 more seconds:
  - Step 2 completes (checkmark)
  - Step 3 becomes active (spinner)
- After ~2 more seconds:
  - Step 3 completes (checkmark)
  - Step 4 becomes active, then completes (checkmark)
- Success alert: "Bridge transaction confirmed!"
- Transaction ID displayed
- "Start New Bridge" button appears

**Success Criteria**:
- ✅ Stepper progresses through all states
- ✅ Visual flow is clear (connecting lines fill correctly)
- ✅ Success message displays
- ✅ Transaction ID shown
- ✅ Reset button available

---

### Test Case 2.7: Failed Bridge Transaction

**Prerequisites**:
- Bridge form visible
- Valid form data entered

**Steps**:
1. Fill bridge form with valid data
2. Click "Bridge Tokens"
3. If transaction succeeds (70% chance), refresh and try again until failure
4. Observe error handling

**Expected Results**:
- Progress stepper shows failure state
- Error alert displays: "Transaction failed: [error message]"
- "Retry Transaction" button appears
- Form data is preserved

**Success Criteria**:
- ✅ Error message is clear
- ✅ Retry button is visible
- ✅ Form data preserved for retry
- ✅ User can retry without re-entering data

---

### Test Case 2.8: Retry Failed Transaction

**Prerequisites**:
- Bridge transaction failed
- "Retry Transaction" button visible

**Steps**:
1. After transaction failure, click "Retry Transaction"
2. Observe retry flow

**Expected Results**:
- Progress stepper resets to "Submitting" state
- Same form data is resubmitted
- Progress flows normally (submitting → pending → confirmed or failed)

**Success Criteria**:
- ✅ Retry uses same form data
- ✅ Progress stepper resets correctly
- ✅ Retry flow works as expected

---

### Test Case 2.9: Reset Bridge Form

**Prerequisites**:
- Bridge transaction completed (confirmed or failed)

**Steps**:
1. After transaction completes, click "Start New Bridge" button
2. Observe form reset

**Expected Results**:
- Bridge state resets to `idle`
- Form fields clear:
  - Amount: empty
  - Recipient Address: empty
- Submit button reappears
- Progress stepper disappears

**Success Criteria**:
- ✅ Form resets completely
- ✅ All fields cleared
- ✅ UI returns to initial state
- ✅ User can start new transaction

---

### Test Case 2.10: Hide Bridge Form

**Prerequisites**:
- Bridge form visible

**Steps**:
1. Click "Hide Bridge" button
2. Observe form hiding

**Expected Results**:
- Bridge form slides up smoothly (animation)
- Button text changes to "Bridge Tokens"
- Form is hidden

**Success Criteria**:
- ✅ Smooth hide animation
- ✅ Button text updates correctly
- ✅ Form hidden completely

---

## Feature 3: Multi-Asset Support (BONUS)

### Test Case 3.1: Asset-Chain Selection (wBTC on Ethereum)

**Prerequisites**:
- Wallet not connected (AssetChainSelector visible)

**Steps**:
1. Observe AssetChainSelector dropdown in header
2. Click dropdown
3. Select "wBTC on Ethereum Mainnet"
4. Observe conversion card

**Expected Results**:
- Dropdown shows "wBTC on Ethereum Mainnet" as selected
- Conversion card updates:
  - Input label shows "wBTC"
  - Price display shows wBTC price
  - Asset icon shows wBTC icon
  - Conversion uses wBTC decimals (8)

**Success Criteria**:
- ✅ Selection persists
- ✅ Conversion card updates correctly
- ✅ Price fetches for wBTC
- ✅ Decimals handled correctly (8 decimals)

---

### Test Case 3.2: Asset-Chain Selection (USDC on Polygon)

**Prerequisites**:
- Wallet not connected

**Steps**:
1. Click AssetChainSelector dropdown
2. Select "USDC on Polygon"
3. Observe conversion card

**Expected Results**:
- Dropdown shows "USDC on Polygon" as selected
- Conversion card updates:
  - Input label shows "USDC"
  - Price display shows USDC price (~$1.00)
  - Asset icon shows USDC icon
  - Conversion uses USDC decimals (6)

**Success Criteria**:
- ✅ USDC selected correctly
- ✅ Polygon chain indicated
- ✅ Price fetches for USDC
- ✅ Decimals handled correctly (6 decimals)

---

### Test Case 3.3: Asset-Chain Selection (DAI on Arbitrum)

**Prerequisites**:
- Wallet not connected

**Steps**:
1. Click AssetChainSelector dropdown
2. Select "DAI on Arbitrum"
3. Observe conversion card

**Expected Results**:
- Dropdown shows "DAI on Arbitrum" as selected
- Conversion card updates:
  - Input label shows "DAI"
  - Price display shows DAI price (~$1.00)
  - Asset icon shows DAI icon
  - Conversion uses DAI decimals (18)

**Success Criteria**:
- ✅ DAI selected correctly
- ✅ Arbitrum chain indicated
- ✅ Price fetches for DAI
- ✅ Decimals handled correctly (18 decimals)

---

### Test Case 3.4: Price Fetching and Caching

**Prerequisites**:
- Multiple assets available

**Steps**:
1. Select "wBTC on Ethereum Mainnet"
2. Wait for price to load
3. Switch to "USDC on Polygon"
4. Switch back to "wBTC on Ethereum Mainnet"
5. Observe network requests (DevTools Network tab)

**Expected Results**:
- First selection: API call to CoinGecko
- Second selection: API call to CoinGecko (different asset)
- Third selection: No API call (cached, instant display)

**Success Criteria**:
- ✅ Prices cache correctly
- ✅ Cached prices display instantly
- ✅ Cache persists for ~1 minute (staleTime)
- ✅ Network requests minimized

---

### Test Case 3.5: Asset-Chain Mismatch Detection

**Prerequisites**:
- Wallet connected to Ethereum Mainnet
- Asset-chain selected that doesn't match connected chain

**Steps**:
1. Connect wallet to Ethereum Mainnet
2. Select "USDC on Polygon" (mismatch)
3. Observe alert

**Expected Results**:
- Alert appears: "Switch wallet to Polygon or select a different asset-chain."
- Alert auto-dismisses after 10 seconds
- Alert disappears if wallet disconnected

**Success Criteria**:
- ✅ Mismatch detected correctly
- ✅ Alert message is clear and actionable
- ✅ Alert auto-dismisses
- ✅ Alert clears on disconnect

---

### Test Case 3.6: Balance Display (Connected Wallet)

**Prerequisites**:
- Wallet connected to Ethereum Mainnet
- Selected asset-chain matches connected chain (e.g., "wBTC on Ethereum Mainnet")
- Wallet has tokens of selected asset

**Steps**:
1. Connect wallet to Ethereum Mainnet
2. Select "wBTC on Ethereum Mainnet"
3. Observe balance display

**Expected Results**:
- Balance appears in WalletInfoBar header
- Balance shows: "Balance: X.XXXXXX wBTC"
- Balance updates if wallet balance changes
- Balance shows "..." while loading

**Success Criteria**:
- ✅ Balance displays correctly
- ✅ Formatting matches asset decimals
- ✅ Loading state handled
- ✅ Balance updates dynamically

---

### Test Case 3.7: Balance Display in Bridge Form

**Prerequisites**:
- Wallet connected
- Selected asset-chain matches connected chain
- Bridge form visible

**Steps**:
1. Connect wallet to Ethereum Mainnet
2. Select "wBTC on Ethereum Mainnet"
3. Open bridge form
4. Observe amount input field

**Expected Results**:
- Balance appears at top-right of "Amount" input field
- Balance aligned vertically with "Amount" label
- Balance shows: "Balance: X.XXXXXX wBTC"
- Balance updates if wallet balance changes

**Success Criteria**:
- ✅ Balance displays in correct location
- ✅ Alignment is correct
- ✅ Formatting matches asset decimals
- ✅ Balance updates dynamically

---

### Test Case 3.8: Conversion with Different Assets

**Prerequisites**:
- Asset-chain selected

**Steps**:
1. Select "wBTC on Ethereum Mainnet"
2. Enter "100" in USD input
3. Observe conversion to wBTC
4. Switch to "USDC on Polygon"
5. Enter "100" in USD input
6. Observe conversion to USDC

**Expected Results**:
- wBTC conversion: Shows ~0.00114 wBTC (using wBTC price ~$87,682)
- USDC conversion: Shows ~100 USDC (using USDC price ~$1.00)
- Decimals formatted correctly per asset (8 for wBTC, 6 for USDC)

**Success Criteria**:
- ✅ Conversion uses correct asset price
- ✅ Decimals formatted per asset
- ✅ Conversion updates when asset changes
- ✅ Results are accurate

---

### Test Case 3.9: Asset Icon Display

**Prerequisites**:
- Asset-chain selected

**Steps**:
1. Select different assets (wBTC, USDC, DAI)
2. Observe asset icons in conversion card

**Expected Results**:
- wBTC: Shows wBTC icon (Bitcoin logo)
- USDC: Shows USDC icon (Circle logo)
- DAI: Shows DAI icon (Maker logo)
- Icons load correctly (no broken images)

**Success Criteria**:
- ✅ Correct icons display per asset
- ✅ Icons load without errors
- ✅ Icons are appropriately sized

---

### Test Case 3.10: Unsupported Asset-Chain Combination

**Prerequisites**:
- Wallet connected to unsupported chain for selected asset

**Steps**:
1. Connect wallet to Arbitrum
2. Select "USDC on Polygon" (USDC not available on Arbitrum)
3. Observe behavior

**Expected Results**:
- Asset-chain mismatch alert appears
- Conversion still works (uses Polygon price)
- Bridge form may show warnings if asset not available on connected chain

**Success Criteria**:
- ✅ Mismatch detected
- ✅ User informed clearly
- ✅ App doesn't crash
- ✅ Graceful degradation

---

## Cross-Feature Integration Tests

### Test Case 4.1: Full Flow - Convert and Bridge

**Prerequisites**:
- Wallet connected
- Asset selected

**Steps**:
1. Select "wBTC on Ethereum Mainnet"
2. Convert 100 USD to wBTC
3. Click "Bridge Tokens"
4. Fill bridge form with converted amount
5. Submit bridge transaction

**Expected Results**:
- Conversion works correctly
- Bridge form pre-fills with selected asset-chain
- Bridge transaction completes successfully
- All features work together seamlessly

**Success Criteria**:
- ✅ Features integrate correctly
- ✅ Data flows between features
- ✅ No conflicts or errors
- ✅ Smooth user experience

---

### Test Case 4.2: Error Recovery

**Prerequisites**:
- All features available

**Steps**:
1. Connect to unsupported chain
2. Try to use conversion
3. Switch to supported chain
4. Try bridge transaction
5. If bridge fails, retry

**Expected Results**:
- Errors are handled gracefully
- User can recover from errors
- App state remains consistent
- No crashes or broken states

**Success Criteria**:
- ✅ Errors don't break app
- ✅ Recovery paths work
- ✅ State remains consistent
- ✅ User can continue after errors

---

## Accessibility Tests

### Test Case 5.1: Keyboard Navigation

**Prerequisites**:
- No mouse/trackpad usage

**Steps**:
1. Navigate using Tab key
2. Interact with all controls using keyboard
3. Submit forms using Enter key

**Expected Results**:
- All interactive elements are focusable
- Focus indicators are visible
- Tab order is logical
- Forms submit with Enter key

**Success Criteria**:
- ✅ Full keyboard accessibility
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ No keyboard traps

---

### Test Case 5.2: Screen Reader Compatibility

**Prerequisites**:
- Screen reader enabled (e.g., NVDA, JAWS, VoiceOver)

**Steps**:
1. Navigate app with screen reader
2. Listen to announcements
3. Interact with forms and buttons

**Expected Results**:
- All elements have ARIA labels
- Form fields are properly labeled
- Button purposes are announced
- Status changes are announced

**Success Criteria**:
- ✅ Screen reader compatible
- ✅ All elements labeled
- ✅ Status announcements work
- ✅ Navigation is logical

---

## Performance Tests

### Test Case 6.1: Price Caching Performance

**Prerequisites**:
- Network tab open in DevTools

**Steps**:
1. Select asset, wait for price load
2. Switch to another asset
3. Switch back to first asset
4. Observe network requests

**Expected Results**:
- First selection: API call
- Second selection: API call (different asset)
- Third selection: No API call (cached)

**Success Criteria**:
- ✅ Cache reduces API calls
- ✅ Cached data loads instantly
- ✅ Cache invalidation works correctly

---

### Test Case 6.2: Form Performance

**Prerequisites**:
- Bridge form visible

**Steps**:
1. Type quickly in amount field
2. Type quickly in recipient address field
3. Observe debouncing

**Expected Results**:
- Amount input responds immediately (no debounce needed)
- Recipient address validation debounced (~500ms)
- No excessive API calls for contract detection

**Success Criteria**:
- ✅ Input feels responsive
- ✅ Debouncing prevents excessive calls
- ✅ No performance issues

---

## Browser Compatibility

### Test Case 7.1: Chrome/Edge

**Prerequisites**:
- Chrome or Edge browser

**Steps**:
1. Test all features in Chrome/Edge
2. Verify wallet connections work
3. Test all interactions

**Expected Results**:
- All features work correctly
- Wallet connections succeed
- No browser-specific errors

**Success Criteria**:
- ✅ Full functionality in Chrome/Edge
- ✅ No console errors
- ✅ Wallet integration works

---

### Test Case 7.2: Firefox

**Prerequisites**:
- Firefox browser

**Steps**:
1. Test all features in Firefox
2. Verify wallet connections work
3. Test all interactions

**Expected Results**:
- All features work correctly
- Wallet connections succeed
- No browser-specific errors

**Success Criteria**:
- ✅ Full functionality in Firefox
- ✅ No console errors
- ✅ Wallet integration works

---

### Test Case 7.3: Safari

**Prerequisites**:
- Safari browser (if available)

**Steps**:
1. Test all features in Safari
2. Verify wallet connections work
3. Test all interactions

**Expected Results**:
- All features work correctly (may have limitations)
- Wallet connections work (if supported)
- No critical errors

**Success Criteria**:
- ✅ Core functionality works
- ✅ No critical errors
- ✅ Graceful degradation if needed

---

## Mobile Responsiveness

### Test Case 8.1: Mobile Viewport

**Prerequisites**:
- Browser DevTools mobile emulation or mobile device

**Steps**:
1. Resize browser to mobile viewport (< 640px)
2. Test all features
3. Verify layout and interactions

**Expected Results**:
- Layout adapts to mobile
- Touch interactions work
- Forms are usable
- No horizontal scrolling

**Success Criteria**:
- ✅ Responsive layout
- ✅ Touch-friendly interactions
- ✅ Forms usable on mobile
- ✅ No layout issues

---

## Known Limitations

During manual testing, note the following limitations:

1. **Mock Bridge API**: Bridge transactions are simulated, not real blockchain transactions
2. **Balance Mocking**: Token balances are read from contracts but may be mocked for non-wBTC assets
3. **Network Switching**: App detects network changes but doesn't automatically switch user's wallet network
4. **Price Updates**: Prices cache for 1 minute; may not reflect real-time changes immediately
5. **Contract Address Detection**: Requires RPC calls; may be slow on some networks

---

## Test Execution Checklist

Use this checklist to ensure all tests are executed:

- [ ] Network Resilience UX (7 test cases)
- [ ] Simulated Bridge Transaction (10 test cases)
- [ ] Multi-Asset Support (10 test cases)
- [ ] Cross-Feature Integration (2 test cases)
- [ ] Accessibility (2 test cases)
- [ ] Performance (2 test cases)
- [ ] Browser Compatibility (3 test cases)
- [ ] Mobile Responsiveness (1 test case)

**Total Test Cases: 37**

---

## Reporting Issues

When reporting issues found during manual testing, include:
- Test case number and name
- Steps to reproduce
- Expected vs actual results
- Browser and version
- Wallet and version
- Screenshots if applicable
- Console errors if any

