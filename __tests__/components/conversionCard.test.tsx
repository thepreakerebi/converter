import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversionCard } from '../../app/_components/conversionCard'
import * as conversionLib from '@/lib/conversion'

// Mock wagmi hooks
const mockUseConnections = vi.fn<() => Array<{ id: string }>>(() => [])
const mockUseChainId = vi.fn<() => number>(() => 1)
const mockUseReadContract = vi.fn<() => { data: unknown; isLoading: boolean }>(() => ({
  data: undefined,
  isLoading: false,
}))

vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi')
  return {
    ...actual,
    useConnections: () => mockUseConnections(),
    useChainId: () => mockUseChainId(),
    useReadContract: () => mockUseReadContract(),
  }
})

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}))

// Mock conversion library
vi.mock('@/lib/conversion', async () => {
  const actual = await vi.importActual('@/lib/conversion')
  return {
    ...actual,
    fetchBitcoinPrice: vi.fn(),
  }
})

describe('ConversionCard', () => {
  const mockFetchBitcoinPrice = vi.mocked(conversionLib.fetchBitcoinPrice)

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchBitcoinPrice.mockResolvedValue(50000)
    // Default: wallet not connected
    mockUseConnections.mockReturnValue([])
    mockUseChainId.mockReturnValue(1)
    mockUseReadContract.mockReturnValue({
      data: undefined,
      isLoading: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render conversion card', async () => {
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByText(/Convert to wBTC/i)).toBeInTheDocument()
    })
  })

  it('should display USD mode by default', async () => {
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByText(/Convert to wBTC/i)).toBeInTheDocument()
      expect(screen.getByText(/Enter USD amount/i)).toBeInTheDocument()
    })
  })

  it('should toggle to wBTC mode when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByText(/Convert to wBTC/i)).toBeInTheDocument()
    })

    const toggleButton = screen.getByLabelText(/Switch to wBTC input mode/i)
    await user.click(toggleButton)

    await waitFor(() => {
      const title = screen.getAllByText(/Convert to USD/i)[0]
      expect(title).toBeInTheDocument()
      expect(screen.getByText(/Enter wBTC amount/i)).toBeInTheDocument()
    })
  })

  it('should show loading state when fetching BTC price', async () => {
    mockFetchBitcoinPrice.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByText(/Fetching current Bitcoin price/i)).toBeInTheDocument()
    })
  })

  it('should display BTC price when loaded', async () => {
    mockFetchBitcoinPrice.mockResolvedValue(87682.5)

    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByText(/1 wBTC ≈/i)).toBeInTheDocument()
      expect(screen.getByText(/\$87,682.50/i)).toBeInTheDocument()
    })
  })

  it('should show wallet connection alert when not connected', async () => {
    render(<ConversionCard />)

    await waitFor(() => {
      expect(
        screen.getByText(/Please connect your wallet to enable conversion features/i)
      ).toBeInTheDocument()
    })
  })

  it('should call onConversionChange when input value changes', async () => {
    const user = userEvent.setup()
    const onConversionChange = vi.fn()

    render(<ConversionCard onConversionChange={onConversionChange} />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Enter amount in USD/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/Enter amount in USD/i)
    await user.type(input, '1000')

    await waitFor(() => {
      expect(onConversionChange).toHaveBeenCalled()
    })
  })

  it('should show clear button when input has value', async () => {
    const user = userEvent.setup()
    // Connect wallet to enable input
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Enter amount in USD/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/Enter amount in USD/i)
    await user.type(input, '100')

    await waitFor(
      () => {
        const clearButton = screen.queryByRole('button', { name: /Clear input/i })
        expect(clearButton).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should clear input when clear button is clicked', async () => {
    const user = userEvent.setup()
    // Connect wallet to enable input
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Enter amount in USD/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/Enter amount in USD/i) as HTMLInputElement
    await user.type(input, '100')

    await waitFor(
      () => {
        const clearButton = screen.queryByRole('button', { name: /Clear input/i })
        expect(clearButton).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    const clearButton = screen.getByRole('button', { name: /Clear input/i })
    await user.click(clearButton)

    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('should validate USD input with max 2 decimals', async () => {
    const user = userEvent.setup()
    // Connect wallet to enable input
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Enter amount in USD/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/Enter amount in USD/i)
    await user.type(input, '100.123')

    await waitFor(
      () => {
        expect(
          screen.getByText(/Invalid format.*up to 2 decimal places/i)
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should validate wBTC input with max 8 decimals', async () => {
    const user = userEvent.setup()
    // Connect wallet to enable input
    mockUseConnections.mockReturnValue([{ id: 'test-connection' }])
    
    render(<ConversionCard />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Switch to wBTC input mode/i)).toBeInTheDocument()
    })

    // Toggle to wBTC mode
    const toggleButton = screen.getByLabelText(/Switch to wBTC input mode/i)
    await user.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Enter amount in WBTC/i)).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/Enter amount in WBTC/i)
    await user.type(input, '1.123456789')

    await waitFor(
      () => {
        expect(
          screen.getByText(/Invalid format.*up to 8 decimal places/i)
        ).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('should show error when BTC price fetch fails', async () => {
    const errorMessage = 'Network error'
    mockFetchBitcoinPrice.mockRejectedValue(new Error(errorMessage))

    render(<ConversionCard />)

    await waitFor(
      () => {
        // The error message is set to err.message, so it should be just "Network error"
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      },
      { timeout: 5000 }
    )
  })
})

