var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var R = require('ramda');
var flyd = require('flyd');
flyd.scanMerge = require('flyd/module/scanmerge');

function undo(config) {
  var actions = R.map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        stream = _ref2[0],
        updater = _ref2[1];

    return [flyd.map(function (x) {
      return [x, updater];
    }, stream), performAction];
  }, config.actions);
  return flyd.immediate(flyd.scanMerge(R.concat([[config.undo, performUndo], [config.redo, performRedo]], actions), { current: config.default, forward: [], backward: [] }));
}

var performAction = function (history, _ref3) {
  var _ref4 = _slicedToArray(_ref3, 2),
      val = _ref4[0],
      updaterFn = _ref4[1];

  history.backward = R.prepend(history.current, history.backward);
  history.current = updaterFn(history.current, val);
  history.forward = [];
  return history;
};

var performUndo = function (history, x) {
  history.forward = R.prepend(history.current, history.forward);
  history.current = history.backward[0];
  history.backward = R.tail(history.backward);
  return history;
};

var performRedo = function (history, x) {
  history.backward = R.prepend(history.current, history.backward);
  history.current = history.forward[0];
  history.forward = R.tail(history.forward);
  return history;
};

module.exports = undo;

