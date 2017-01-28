const R = require('ramda')
const flyd = require('flyd')
flyd.scanMerge = require('flyd/module/scanmerge')

function undo(config) {
  const actions = R.map(
    ([stream, updater]) => [flyd.map(x => [x, updater], stream), performAction]
  , config.actions
  )
  return flyd.immediate(
    flyd.scanMerge(
      R.concat(
        [[config.undo, performUndo], [config.redo, performRedo]]
      , actions
      )
    , {current: config.default, forward: [], backward: []}
    )
  )
}

const performAction = (history, [val, updaterFn]) => {
  history.backward = R.prepend(history.current, history.backward)
  history.current = updaterFn(history.current, val)
  history.forward = []
  return history
}

const performUndo = (history, x) => {
  history.forward = R.prepend(history.current, history.forward)
  history.current = history.backward[0]
  history.backward = R.tail(history.backward)
  return history
}

const performRedo = (history, x) => {
  history.backward = R.prepend(history.current, history.backward)
  history.current = history.forward[0]
  history.forward = R.tail(history.forward)
  return history
}

module.exports = undo
