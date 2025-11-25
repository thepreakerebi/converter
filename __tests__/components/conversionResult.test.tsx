import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConversionResult } from '../../app/_components/conversionResult'

describe('ConversionResult', () => {
  it('should not render when convertedAmount is null', () => {
    const { container } = render(
      <ConversionResult
        convertedAmount={null}
        currencyMode="USD"
        inputValue="100"
        error={null}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should not render when there is an error', () => {
    const { container } = render(
      <ConversionResult
        convertedAmount={100}
        currencyMode="USD"
        inputValue="100"
        error="Some error"
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('should render conversion result for USD to wBTC', () => {
    render(
      <ConversionResult
        convertedAmount={0.02}
        currencyMode="USD"
        inputValue="1000"
        error={null}
      />
    )

    expect(screen.getByText('Conversion Result')).toBeInTheDocument()
    expect(screen.getByText(/0.02 wBTC/i)).toBeInTheDocument()
    expect(screen.getByText(/Equivalent to \$1,000.00/i)).toBeInTheDocument()
  })

  it('should render conversion result for wBTC to USD', () => {
    render(
      <ConversionResult
        convertedAmount={50000}
        currencyMode="WBTC"
        inputValue="1"
        error={null}
      />
    )

    expect(screen.getByText('Conversion Result')).toBeInTheDocument()
    expect(screen.getByText(/\$50,000.00/i)).toBeInTheDocument()
    expect(screen.getByText(/Equivalent to 1 wBTC/i)).toBeInTheDocument()
  })

  it('should format small amounts correctly', () => {
    render(
      <ConversionResult
        convertedAmount={0.00001}
        currencyMode="USD"
        inputValue="0.5"
        error={null}
      />
    )

    expect(screen.getByText(/0.00001 wBTC/i)).toBeInTheDocument()
    expect(screen.getByText(/Equivalent to \$0.50/i)).toBeInTheDocument()
  })

  it('should handle empty input value', () => {
    render(
      <ConversionResult
        convertedAmount={100}
        currencyMode="USD"
        inputValue=""
        error={null}
      />
    )

    expect(screen.getByText(/Equivalent to \$0.00/i)).toBeInTheDocument()
  })
})

