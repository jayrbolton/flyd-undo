const test = require('tape')
const flyd = require('flyd')
const R = require('ramda')
const undo = require('../index.js')

test('it initializes with a default and empty stacks', t=> {
  const state$ = undo({
    default: {}
  , undo: flyd.stream()
  , redo: flyd.stream()
  , actions: []
  })
  t.deepEqual(state$().current, {})
  t.deepEqual(state$().forward, [])
  t.deepEqual(state$().backward, [])
  t.end()
})

test('sets the current slot and backward stack with an action', t=> {
  const set$ = flyd.stream()
  const state$ = undo({
    default: {}
  , undo: flyd.stream()
  , redo: flyd.stream()
  , actions: [
      [set$,  (state, [key, val]) => R.assoc(key, val, state)]
    ]
  })
  set$(['x', 1])
  t.deepEqual(state$().current, {x: 1})
  t.deepEqual(state$().backward, [{}])
  t.end()
})

function setup() {
  const set$ = flyd.stream()
  const undo$ = flyd.stream()
  const redo$ = flyd.stream()
  const state$ = undo({
    default: {}
  , undo: undo$
  , redo: redo$
  , actions: [
      [set$,  (state, [key, val]) => R.assoc(key, val, state)]
    ]
  })
  return {set$, state$, undo$, redo$}
}

test('sets the current slot and backward stack with two actions', t=> {
  const {set$, state$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  t.deepEqual(state$().current, {x: 1, y: 2})
  t.deepEqual(state$().backward, [{x: 1}, {}])
  t.end()
})

test('undo pops the backward stack to the current slot and moves the current slot to the forward stack', t=> {
  const {set$, state$, undo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  t.deepEqual(state$().current, {x: 1})
  t.deepEqual(state$().backward, [{}])
  t.deepEqual(state$().forward, [{x: 1, y: 2}])
  t.end()
})

test('undo then redo is a no-op', t=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  t.deepEqual(state$().current, {x: 1, y: 2})
  t.deepEqual(state$().backward, [{x: 1}, {}])
  t.deepEqual(state$().forward, [])
  undo$(true)
  redo$(true)
  t.deepEqual(state$().current, {x: 1, y: 2})
  t.deepEqual(state$().backward, [{x: 1}, {}])
  t.deepEqual(state$().forward, [])
  t.end()
})

test('two undos and one redo is equivalent to one undo', t=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  t.deepEqual(state$().current, {x: 1})
  t.deepEqual(state$().backward, [{}])
  t.deepEqual(state$().forward, [{x: 1, y: 2}])
  undo$(true)
  redo$(true)
  t.deepEqual(state$().current, {x: 1})
  t.deepEqual(state$().backward, [{}])
  t.deepEqual(state$().forward, [{x: 1, y: 2}])
  t.end()
})

test('an undo then an action deletes the forward stack', t=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  set$(['z', 3])
  t.deepEqual(state$().current, {x: 1, z: 3})
  t.deepEqual(state$().backward, [{x: 1}, {}])
  t.deepEqual(state$().forward, [])
  t.end()
})
