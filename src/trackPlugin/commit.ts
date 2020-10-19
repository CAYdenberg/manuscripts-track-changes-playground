import { Mapping, Step, Transform } from 'prosemirror-transform'
import uuid from 'uuid/v4'
import { Span, updateBlame } from './blame'

export interface Commit {
  id: string
  blame: Span[]
  steps: Step[]
  prev: Commit | null
}

export const initialCommit = (): Commit => {
  const id = uuid()

  return {
    id,
    blame: [],
    steps: [],
    prev: null,
  }
}

export const applyTransform = (commit: Commit, tr: Transform) => {
  const newBlame = updateBlame(commit.blame, tr.mapping, commit.id)
  return {
    ...commit,
    blame: newBlame,
    steps: commit.steps.concat(tr.steps),
  }
}

export const freeze = (prev: Commit): Commit => {
  return {
    id: uuid(),
    blame: prev.blame,
    steps: [],
    prev,
  }
}

export const smoosh = <T>(
  commit: Commit,
  selector: (commit: Commit) => T | Array<T>
): Array<T> => {
  const getFromSelector = () => {
    const result = selector(commit)
    return Array.isArray(result) ? result : [result]
  }
  if (commit.prev) {
    return smoosh(commit.prev, selector).concat(getFromSelector())
  }
  return getFromSelector()
}

const reverseMapping = (steps: Step[]): Mapping =>
  new Mapping(
    steps
      .slice()
      .reverse()
      .map((step) => step.getMap().invert())
  )

// NOTE: innerMapping is the mapping between the start of "pick"
// as it currently sits to its new position.
const rebase = (pick: Commit, onto: Commit | null, innerMapping: Mapping) => {
  const mapping = reverseMapping(pick.steps)
  mapping.appendMapping(innerMapping)

  // Remap each step by taking it all the way back through all the reverse steps
  // so far, and then forward through to its current state.
  const remappedSteps = pick.steps
    .map((step, i) => {
      const rI = pick.steps.length - 1 - i

      // slice off the reverse steps after this one
      const remapped = step.map(mapping.slice(rI + 1))
      if (!remapped) return null

      mapping.appendMap(remapped.getMap(), rI)
      return remapped
    })
    .filter(Boolean) as Step[]

  const id = uuid()
  const blame = updateBlame(
    // start from the previous commits blame (or an empty blame)
    onto ? onto.blame : [],
    // update it with the mapping corresponding to ONLY this commit's steps
    new Mapping(remappedSteps.map((step) => step.getMap())),
    id
  )

  return {
    commit: {
      id,
      steps: remappedSteps,
      blame,
      prev: onto,
    },
    mapping,
  }
}

// TODO: Compose this function with some optimizers:
// 1. Does not go any deeper if the commit or its children are not
// set to be exluded. Can safely return the same commit and an empty mapping
// in that case.
// 2. Actually caches the result of any call (including sorting the values in without)
// and stores the return value (or a reference to it).
export const rewindAndPlayback = (
  commit: Commit,
  without: string[]
): { commit: Commit | null; mapping: Mapping } => {
  // we start by remapping the prev, if there is one.
  // If there is no prev commit, begin by setting to null and generating
  // an empty mapping
  const { commit: prev, mapping } = commit.prev
    ? rewindAndPlayback(commit.prev, without)
    : { commit: null, mapping: new Mapping() }

  // if the commit is set to be exluded, we can hoist the child commit. BUT
  // we must add this commits steps to the mapping so that the commits
  // above this one can be rebased.
  if (without.includes(commit.id)) {
    const mappingWithReverseSteps = reverseMapping(commit.steps)
    mappingWithReverseSteps.appendMapping(mapping)
    return { commit: prev, mapping: mappingWithReverseSteps }
  }

  // Remap each step by taking it all the way back through all the reverse steps
  // so far, and then forward through to its current state.
  return rebase(commit, prev, mapping)
}

export const cherryPick = (pick: Commit, onto: Commit) => {
  const mapping = pick.prev
    ? reverseMapping(smoosh<Step>(onto, (c) => c.steps))
    : new Mapping()

  const fMap = new Mapping(
    smoosh<Step>(onto, (c) => c.steps).map((s) => s.getMap())
  )
  mapping.appendMapping(fMap)

  return rebase(pick, onto, mapping)
}
