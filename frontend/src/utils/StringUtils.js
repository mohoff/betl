
const DECIMALS = 2
const LOWEST_DISPLAYABLE_WITH_DECIMALS = 0.01

export const isEmptyString = (str) => {
  return str === ''
}

export const formatAddress = (address) => {
  return address.substring(0, 6) + '...' + address.substring(address.length-4)
}


///
/// Crypto currencies
///

export const formatToMilliEth = (wei) => {
  const milliEth = wei/1e15
  return formatAmount(milliEth)
}

export const formatToEth = (wei) => {
  const eth = wei/1e18
  return formatAmount(eth)
}

const formatAmount = (amount) => {
  return amount < LOWEST_DISPLAYABLE_WITH_DECIMALS
    ? '<' + String(LOWEST_DISPLAYABLE_WITH_DECIMALS)
    : Number(amount.toFixed(DECIMALS)) // Hack to cut off trailing zeros
}


///
/// Fiat currencies
///

export const fiatToSymbol = (fiat) => {
  switch (fiat) {
    case 'EUR':
      return '€'
    default:
      return '$'
  }
}

export const formatFiat = (fiat, isEUR=false) => {
  // Use currency formatting of Europen countries when fiat
  // currency is EUR (Example: 4.123,67). Otherwise use
  // the American currency formatting (Example: 4,123.67).
  const locale = isEUR ? 'it-IT' : undefined

  return fiat.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

export const formatFiatWithCurrency = (fiat) => {
  const currency = process.env.REACT_APP_FIAT_CURRENCY
  if (currency === 'EUR') {
    return '~' + formatFiat(fiat, true) + ' ' + fiatToSymbol(currency)
  }
  if (currency === 'USD') {
    return '~ ' + fiatToSymbol(currency) + formatFiat(fiat)
  }
  return null
}
