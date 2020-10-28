import { Step } from 'prosemirror-transform'
import {
  initialCommit,
  applyTransform,
  freeze,
  Commit,
  smoosh,
} from '../commit'
import * as io from '../io'
import { applyTr, initialState, typeSomething } from './helpers'

test('stringify a commit and get it back', () => {
  let state = initialState()
  let commit = initialCommit()

  // set up a commit with steps and with a step in the prev
  const { tr, state: _state } = typeSomething(state, [[60, 'A']])
  state = _state
  commit = applyTransform(commit, tr)
  commit = freeze(commit)

  const { tr: tr2, state: __state } = typeSomething(state, [[53, 'B']])
  state = __state
  commit = applyTransform(commit, tr2)

  const json = io.commitToJSON(commit)
  expect(() => JSON.parse(json)).not.toThrow()

  const reconstructedCommit: Commit = io.commitFromJSON(json)

  const steps = smoosh<Step>(commit, (c) => c.steps)
  const reconstructedSteps = smoosh<Step>(reconstructedCommit, (c) => c.steps)

  const nextState = applyTr(initialState(), steps)
  const reconstructedState = applyTr(initialState(), reconstructedSteps)

  expect(nextState).toEqual(reconstructedState)
})
