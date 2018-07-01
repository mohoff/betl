import Moment from 'moment'

export const NOW = Date.now()/1000

export const getRelativeTime = (timestamp) => {
  return Moment.unix(timestamp).fromNow()
}