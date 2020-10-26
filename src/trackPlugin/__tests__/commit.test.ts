import { Fragment, Slice } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'
import { EditorState } from 'prosemirror-state'
import { schema } from 'prosemirror-schema-basic'
import { newDocument } from '../../io'
import {
  applyTransform,
  cherryPick,
  Commit,
  freeze,
  initialCommit,
  smoosh,
  rewindAndPlayback,
} from '../commit'
import { Span } from '../blame'

const initialState = () => {
  return EditorState.create({
    doc: newDocument(),
    schema,
  })
}

const typeSomething = (
  state: EditorState,
  additions: Array<[pos: number, text: string]>
) => {
  const { tr } = initialState()
  additions.forEach(([pos, text]) => {
    tr.replace(pos, pos, new Slice(Fragment.from(schema.text(text)), 0, 0))
  })
  state.apply(tr)
  return { state, tr }
}

const applyTr = (initialState: EditorState, steps: Step[]) => {
  let { tr } = initialState
  steps.forEach((step) => {
    tr.step(step)
  })
  return initialState.apply(tr)
}

const blameRemoveUUIDS = (blame: Span[]) =>
  blame
    .map((span) => {
      if (!span.commit) return null
      return { from: span.from, to: span.to }
    })
    .filter(Boolean) as Span[]

describe('applyTransform', () => {
  it('produces a blame map tracking any new additions', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [[53, 'i']])
    const nextCommit = applyTransform(commit, tr)

    expect(nextCommit.steps).toHaveLength(1)
    expect(nextCommit.blame).toHaveLength(1)
  })

  it('groups contiguous spans in the blame map', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'A'],
      [54, 'B'],
    ])
    const nextCommit = applyTransform(commit, tr)

    expect(nextCommit.steps).toHaveLength(2)
    expect(nextCommit.blame).toHaveLength(1)
  })

  it('creates new spans for discontiguous changes', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'A'],
      [60, 'B'],
    ])
    const nextCommit = applyTransform(commit, tr)

    expect(nextCommit.steps).toHaveLength(2)
    expect(nextCommit.blame).toHaveLength(2)
  })
})

describe('freeze', () => {
  it('should place the commit inside a previous commit', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'A'],
      [54, 'B'],
    ])
    const next = applyTransform(commit, tr)
    const frozen = freeze(next)

    expect(frozen.id).not.toEqual(next.id)
    expect(frozen.blame).toEqual(next.blame)
    expect(frozen.prev).toEqual(next)
  })
})

describe('smoosh', () => {
  it('should provide a way to get properties of each commit as a list from inner to outer', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'A'],
      [54, 'B'],
    ])
    const next = applyTransform(commit, tr)
    const nested = freeze(next)

    const selector = (commit: Commit) => commit.id

    const result = smoosh<string>(nested, selector)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(next.id)
  })

  it('should create a flat array from properties that are an array', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'A'],
      [54, 'B'],
    ])
    const next = applyTransform(commit, tr)
    const nested = freeze(next)

    const selector = (commit: Commit) => commit.steps

    const result = smoosh<Step>(nested, selector)
    expect(result).toHaveLength(2)
    expect(result[0]).toBeInstanceOf(Step)
    expect(result[0]).toEqual(next.steps[0])
  })
})

describe('without', () => {
  it('should replay all the steps', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [53, 'B'],
      [60, 'A'],
    ])
    const next = applyTransform(commit, tr)
    const { commit: remapped } = rewindAndPlayback(next, [])

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    expect(blameRemoveUUIDS(next.blame)).toEqual(
      blameRemoveUUIDS(remapped.blame)
    )

    const nextState = applyTr(initialState(), next.steps)
    const remappedState = applyTr(initialState(), remapped.steps)
    expect(nextState).toEqual(remappedState)
  })

  it('should remap all the steps', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = typeSomething(state, [
      [60, 'A'],
      [53, 'B'],
    ])
    const next = applyTransform(commit, tr)
    const { commit: remapped } = rewindAndPlayback(next, [])

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    expect(blameRemoveUUIDS(next.blame)).toEqual(
      blameRemoveUUIDS(remapped.blame)
    )
    const nextState = applyTr(initialState(), next.steps)
    const remappedState = applyTr(initialState(), remapped.steps)
    expect(nextState).toEqual(remappedState)
  })

  it('should remap deletions', () => {
    const state = initialState()
    const commit = initialCommit()

    const { tr } = state
    // delete some text
    tr.replace(53, 60)
    const next = applyTransform(commit, tr)
    const { commit: remapped } = rewindAndPlayback(next, [])

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    expect(blameRemoveUUIDS(next.blame)).toEqual(
      blameRemoveUUIDS(remapped.blame)
    )
    const nextState = applyTr(initialState(), next.steps)
    const remappedState = applyTr(initialState(), remapped.steps)
    expect(nextState).toEqual(remappedState)
  })

  it('should remap across multiple commits', () => {
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

    const { commit: remapped } = rewindAndPlayback(commit, [])

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    // the blames should match
    expect(blameRemoveUUIDS(commit.blame)).toEqual(
      blameRemoveUUIDS(remapped.blame)
    )

    const steps = smoosh<Step>(commit, (c) => c.steps)
    const remappedSteps = smoosh<Step>(remapped, (c) => c.steps)

    // the two states derived from the commit:
    const nextState = applyTr(initialState(), steps)
    const remappedState = applyTr(initialState(), remappedSteps)
    expect(nextState).toEqual(remappedState)
  })

  it('should allow you to exclude commits', () => {
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

    const { commit: remapped } = rewindAndPlayback(commit, [commit.prev!.id])

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    expect(commit.blame).toHaveLength(2)
    expect(remapped.blame).toHaveLength(1)
    expect(commit.blame[0].from).toEqual(remapped.blame[0].from)
    expect(commit.blame[0].to).toEqual(remapped.blame[0].to)
  })
})

describe('cherryPick', () => {
  it('should put commits together that are not based on each other', () => {
    let state = initialState()
    let commit = initialCommit()

    // set up a commit with steps and with a step in the prev
    const { tr } = typeSomething(state, [[60, 'A']])
    commit = applyTransform(commit, tr)

    const { tr: tr2 } = typeSomething(state, [[53, 'B']])
    const unrelatedCommit = applyTransform(commit, tr2)

    const { commit: remapped } = cherryPick(commit, unrelatedCommit)
    const { commit: remappedReverse } = cherryPick(unrelatedCommit, commit)

    if (!remapped) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }
    if (!remappedReverse) {
      throw new Error('Unexpected null from rewindAndPlayback')
    }

    // the blames should match
    expect(blameRemoveUUIDS(remapped.blame)).toEqual(
      blameRemoveUUIDS(remappedReverse.blame)
    )

    const steps = smoosh<Step>(remapped, (c) => c.steps)
    const stepsReversed = smoosh<Step>(remappedReverse, (c) => c.steps)

    // the two states derived from the commit:
    const nextState = applyTr(initialState(), steps)
    const reversedState = applyTr(initialState(), stepsReversed)
    expect(nextState).toEqual(reversedState)
  })
})
