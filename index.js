import flyd from 'flyd'
import R from 'ramda'

function undoinator(config) {
  const stream = flyd.stream()
  return stream
}

module.exports = undoinator
