
const DECIMALS = 2
const LOWEST_DISPLAYABLE_WITH_DECIMALS = 0.01

export const isEmptyString = (str) => {
  return str === ''
}

export const formatAddress = (address) => {
  return address.substring(0, 6) + '...' + address.substring(address.length-4)
}

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
