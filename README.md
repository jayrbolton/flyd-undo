# flyd-undo

This is a flyd utility that makes it easier to create an undo/redo system in your UI. You create a stream of state and actions on that state, and this function will track past versions. Pass in undo and redo streams to push and pop the current version of the state.

This function creates a stream of objects with three properties: `current`, `backward`, and `forward`. The current key holds the current state. The backward key holds an array of previous states (up to a defined limit). And the forward state holds a cache of states that have been undone for the purpose of redo. Thus, the behavior of the flyd-undo function is:
- Undoing causes the current state to move onto the top of the forward stack, and moves the state from the top of the backward stack into the current slot.
- Redoing causes the the current state to move to the top of the backward stack, and moves the state from the top of the forward stack into the current slot.
- Performing any action causes a new state to be created. The previous state gets pushed to the top of the backward stack, and the new state replaces it in the current slot.
- Performing any action also removes all states from the forward stack (removing the ability for previous redos)

_API_

```js
flydUndo({
  default // default, starting state on pageload
, undo // a stream of undo events that trigger a new undo action
, redo // a stream of redo events that trigger a new redo action
, actions // an array of pairs of streams and updater functions similar to scanMerge. Every updater function takes the previous state and the value from the stream and returns a new state.
})
```

_Example_

```js
import R from 'ramda'
import 'flyd' from flyd
import flydUndo from 'flyd-undo'

// This example is a circle drawer
// Click the canvas to create a new circle

// Event stream of undo button clicks
const clickUndo$ = flyd.stream()
// Event stream of redo button clicks
const clickRedo$ = flyd.stream()
// Event stream of clicking on an svg area to create a circle
const clickSvg$ = flyd.stream()

const circles$ = flydUndo({
  default: []
, undo: clickUndo$
, redo: clickRedo$
, actions: [
    [clickSvg$,  appendCircle]
  ]
})

function appendCircle(circles, clickEvent) {
  return R.append(
    {radius: 10, cx: clickEvent.clientX, cy: clickEvent.clientY}
  , circles
  )
}

circles$().current // []
circles$().backward // []
circles$().forward // []

clickSvg$({clientX: 10, clientY: 10}) // trigger click event

circles$().current // [{cx: 10, cy: 10, radius: 10}]
circles$().backward // [[]]
circles$().forward // []

clickSvg$({clientX: 50, clientY: 50}) // trigger click event

circles$().current // [{cx: 50, cy: 50, radius: 10}, {cx: 10, cy: 10, radius: 10}]
circles$().backward // [[{cx: 10, cy: 10, radius: 10}], []]
circles$().forward // []

clickUndo$(true) // trigger undo event

circles$().current // [{cx: 10, cy: 10, radius: 10}]
circles$().backward // [[]]
circles$().forward // [[{cx: 50, cy: 50, radius: 10}, {cx: 10, cy: 10, radius: 10}]]

clickUndo$(true) // trigger another undo event

circles$().current // [[]]
circles$().backward // []
circles$().forward // [[{cx: 10, cy: 10, radius: 10}], [{cx: 50, cy: 50, radius: 10}, {cx: 10, cy: 10, radius: 10}]]

clickRedo$(true) // trigger redo event

circles$().current // [{cx: 10, cy: 10, radius: 10}]
circles$().backward // []
circles$().forward // [[{cx: 50, cy: 50, radius: 10}, {cx: 10, cy: 10, radius: 10}]]

clickSvg$({clientX: 70, clientY: 70}) // trigger another circle creation (an action)

circles$().current // [{cx: 70, cy: 70, radius: 10}, {cx: 10, cy: 10, radius: 10}]
circles$().backward // [[{cx: 10, cy: 10, radius: 10}]]
circles$().forward // []
```


### Dev

- Build with `babel index.es6 > index.js`
- Run tests with `npm run test` or `zuul --local 8888 --ui mocha-qunit -- test`
