import assert from 'assert'
import flyd from 'flyd'
import R from 'ramda'

import undo from '../index.es6'

suite('undo')

test('it initializes with a default and empty stacks', ()=> {
  const state$ = undo({
    default: {}
  , undo: flyd.stream()
  , redo: flyd.stream()
  , actions: []
  })
  assert.deepEqual(state$().current, {})
})

test('sets the current slot and backward stack with an action', ()=> {
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
  assert.deepEqual(state$().current, {x: 1})
  assert.deepEqual(state$().backward, [{}])
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

test('sets the current slot and backward stack with two actions', ()=> {
  const {set$, state$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  assert.deepEqual(state$().current, {x: 1, y: 2})
  assert.deepEqual(state$().backward, [{x: 1}, {}])
})

test('undo pops the backward stack to the current slot and moves the current slot to the forward stack', () => {
  const {set$, state$, undo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  assert.deepEqual(state$().current, {x: 1})
  assert.deepEqual(state$().backward, [{}])
  assert.deepEqual(state$().forward, [{x: 1, y: 2}])
})

test('undo then redo is a no-op', ()=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  assert.deepEqual(state$().current, {x: 1, y: 2})
  assert.deepEqual(state$().backward, [{x: 1}, {}])
  assert.deepEqual(state$().forward, [])
  undo$(true)
  redo$(true)
  assert.deepEqual(state$().current, {x: 1, y: 2})
  assert.deepEqual(state$().backward, [{x: 1}, {}])
  assert.deepEqual(state$().forward, [])
})

test('two undos and one redo is equivalent to one undo', ()=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  assert.deepEqual(state$().current, {x: 1})
  assert.deepEqual(state$().backward, [{}])
  assert.deepEqual(state$().forward, [{x: 1, y: 2}])
  undo$(true)
  redo$(true)
  assert.deepEqual(state$().current, {x: 1})
  assert.deepEqual(state$().backward, [{}])
  assert.deepEqual(state$().forward, [{x: 1, y: 2}])
})

test('an undo then an action deletes the forward stack', ()=> {
  const {set$, state$, undo$, redo$} = setup()
  set$(['x', 1])
  set$(['y', 2])
  undo$(true)
  set$(['z', 3])
  assert.deepEqual(state$().current, {x: 1, z: 3})
  assert.deepEqual(state$().backward, [{x: 1}, {}])
  assert.deepEqual(state$().forward, [])
})
