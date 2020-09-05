import { Plugin, Transaction } from 'prosemirror-state'
import { Step, StepMap as Map, Transform } from 'prosemirror-transform'
import { schema } from 'prosemirror-schema-basic'

export class Commit {
  public message: string
  public time: Date
  public steps: Step[]
  public maps: Map[]
  public hidden: boolean

  constructor(
    message: string,
    time: Date,
    steps: Step[],
    maps: Map[],
    hidden: boolean = false
  ) {
    this.message = message
    this.time = time
    this.steps = steps
    this.maps = maps
    this.hidden = hidden
  }
}

class Span {
  public commit: number | null
  public from: number
  public to: number

  constructor(from: number, to: number, commit: number | null) {
    this.from = from
    this.to = to
    this.commit = commit
  }
}

const insertIntoBlameMap = (
  map: Span[],
  from: number,
  to: number,
  commit: number
) => {
  if (from >= to) return
  let pos = 0,
    next
  for (; pos < map.length; pos++) {
    next = map[pos]
    if (next.commit == commit) {
      if (next.to >= from) break
    } else if (next.to > from) {
      // Different commit, not before
      if (next.from < from) {
        // Sticks out to the left (loop below will handle right side)
        let left = new Span(next.from, from, next.commit)
        if (next.to > to) map.splice(pos++, 0, left)
        else map[pos++] = left
      }
      break
    }
  }

  while ((next = map[pos])) {
    if (next.commit == commit) {
      if (next.from > to) break
      from = Math.min(from, next.from)
      to = Math.max(to, next.to)
      map.splice(pos, 1)
    } else {
      if (next.from >= to) break
      if (next.to > to) {
        map[pos] = new Span(to, next.to, next.commit)
        break
      } else {
        map.splice(pos, 1)
      }
    }
  }

  map.splice(pos, 0, new Span(from, to, commit))
}

const updateBlameMap = (map: Span[], transform: Transform, id: number) => {
  let result: Span[] = []
  const mapping = transform.mapping

  for (let i = 0; i < map.length; i++) {
    let span = map[i]
    let from = mapping.map(span.from, 1),
      to = mapping.map(span.to, -1)
    if (from < to) result.push(new Span(from, to, span.commit))
  }

  for (let i = 0; i < mapping.maps.length; i++) {
    let map = mapping.maps[i],
      after = mapping.slice(i + 1)
    map.forEach((_s, _e, start, end) => {
      insertIntoBlameMap(result, after.map(start, 1), after.map(end, -1), id)
    })
  }

  return result
}

// TrackState{
export class TrackState {
  public commits: Commit[]
  public blameMap: Span[]
  private uncommittedSteps: Step[]
  private uncommittedMaps: Map[]

  constructor(
    blameMap: Span[],
    commits: Commit[],
    uncommittedSteps: Step[],
    uncommittedMaps: Map[]
  ) {
    // The blame map is a data structure that lists a sequence of
    // document ranges, along with the commit that inserted them. This
    // can be used to, for example, highlight the part of the document
    // that was inserted by a commit.
    this.blameMap = blameMap
    // The commit history, as an array of objects.
    this.commits = commits
    // Inverted steps and their maps corresponding to the changes that
    // have been made since the last commit.
    this.uncommittedSteps = uncommittedSteps
    this.uncommittedMaps = uncommittedMaps
  }

  // Apply a transform to this state
  applyTransform(transform: Transform) {
    // Invert the steps in the transaction, to be able to save them in
    // the next commit
    let inverted = transform.steps.map((step, i) =>
      step.invert(transform.docs[i])
    )
    let newBlame = updateBlameMap(this.blameMap, transform, this.commits.length)
    // Create a new state—since these are part of the editor state, a
    // persistent data structure, they must not be mutated.
    return new TrackState(
      newBlame,
      this.commits,
      this.uncommittedSteps.concat(inverted),
      this.uncommittedMaps.concat(transform.mapping.maps)
    )
  }

  // When a transaction is marked as a commit, this is used to put any
  // uncommitted steps into a new commit.
  applyCommit(message: string, time: Date) {
    if (this.uncommittedSteps.length == 0) return this
    let commit = new Commit(
      message,
      time,
      this.uncommittedSteps,
      this.uncommittedMaps
    )
    return new TrackState(this.blameMap, this.commits.concat(commit), [], [])
  }
}

export const trackPlugin = new Plugin<TrackState, typeof schema>({
  state: {
    init(_, instance): TrackState {
      return new TrackState(
        [new Span(0, instance.doc.content.size, null)],
        [],
        [],
        []
      )
    },
    apply(tr: Transaction<typeof schema>, tracked: TrackState) {
      if (tr.docChanged) tracked = tracked.applyTransform(tr)

      let commitMessage = tr.getMeta(this)
      if (commitMessage)
        tracked = tracked.applyCommit(commitMessage, new Date(tr.time))
      return tracked
    },
  },
})
