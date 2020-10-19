import { Transaction } from 'prosemirror-state'
import { Mapping, Step, StepMap as Map, Transform } from 'prosemirror-transform'
import { Decoration } from 'prosemirror-view'
import Commit from './commit'
import Span from './span'

const insertIntoBlameMap = (
  map: Span[],
  from: number,
  to: number,
  commit: number
) => {
  // if (from >= to) return

  let pos = 0,
    next
  for (; pos < map.length; pos++) {
    next = map[pos]
    if (next.commit === commit && next.to >= from) {
      break
    } else if (next.to > from) {
      // Different commit, not before
      if (next.from < from) {
        // Sticks out to the left (loop below will handle right side)
        const left = new Span(next.from, from, next.commit)
        if (next.to > to) {
          map.splice(pos++, 0, left)
        } else {
          map[pos++] = left
        }
      }
      break
    }
  }

  while ((next = map[pos])) {
    if (next.commit === commit && next.from > to) {
      break
    } else if (next.commit === commit) {
      from = Math.min(from, next.from)
      to = Math.max(to, next.to)
      map.splice(pos, 1)
    } else if (next.from >= to) {
      break
    } else if (next.to > to) {
      map[pos] = new Span(to, next.to, next.commit)
      break
    } else {
      map.splice(pos, 1)
    }
  }

  map.splice(pos, 0, new Span(from, to, commit))
}

const updateBlameMap = (map: Span[], transform: Transform, id: number) => {
  const result: Span[] = []
  const mapping = transform.mapping

  for (let i = 0; i < map.length; i++) {
    const span = map[i]
    const from = mapping.map(span.from, 1)
    const to = mapping.map(span.to, -1)
    if (from < to) {
      result.push(new Span(from, to, span.commit))
    }
  }

  for (let i = 0; i < mapping.maps.length; i++) {
    const map = mapping.maps[i]
    const after = mapping.slice(i + 1)
    map.forEach((_s, _e, start, end) => {
      insertIntoBlameMap(result, after.map(start, 1), after.map(end, -1), id)
    })
  }

  return result
}

export default class Tracked {
  public commits: Commit[]
  public blameMap: Span[]
  public uncommittedSteps: Step[]
  private uncommittedMaps: Map[]

  constructor(
    blameMap: Span[],
    commits?: Commit[],
    uncommittedSteps?: Step[],
    uncommittedMaps?: Map[]
  ) {
    // The blame map is a data structure that lists a sequence of
    // document ranges, along with the commit that inserted them. This
    // can be used to, for example, highlight the part of the document
    // that was inserted by a commit.
    this.blameMap = blameMap
    // The commit history, as an array of objects.
    this.commits = commits || []
    // Inverted steps and their maps corresponding to the changes that
    // have been made since the last commit.
    this.uncommittedSteps = uncommittedSteps || []
    this.uncommittedMaps = uncommittedMaps || []
  }

  // Apply a transform to this state
  applyTransform(transform: Transform) {
    // Invert the steps in the transaction, to be able to save them in
    // the next commit
    const inverted = transform.steps.map((step, i) =>
      step.invert(transform.docs[i])
    )
    const newBlame = updateBlameMap(
      this.blameMap,
      transform,
      this.commits.length
    )
    // Create a new state—since these are part of the editor state, a
    // persistent data structure, they must not be mutated.
    return new Tracked(
      newBlame,
      this.commits,
      this.uncommittedSteps.concat(inverted),
      this.uncommittedMaps.concat(transform.mapping.maps)
    )
  }

  // When a transaction is marked as a commit, this is used to put any
  // uncommitted steps into a new commit.
  applyCommit(message?: string) {
    if (this.uncommittedSteps.length === 0) {
      return this
    }
    const commit = new Commit(
      this.uncommittedSteps,
      this.uncommittedMaps,
      message
    )
    return new Tracked(this.blameMap, this.commits.concat(commit))
  }

  revertCommit(index: number) {
    // Reverting is only possible if there are no uncommitted changes
    if (this.uncommittedSteps.length) {
      return this
    }
    const commits = this.commits.map((commit, i) =>
      i === index ? commit.reject() : commit
    )
    return new Tracked(this.blameMap, commits)
  }

  getRevertTr(index: number, tr: Transaction) {
    // Reverting is only possible if there are no uncommitted changes
    if (this.uncommittedSteps.length) {
      throw new Error('Cannot revert when there are uncommitted changes')
    }

    const commitToRevert = this.commits[index]

    // This is the mapping from the document as it was at the start of
    // the commit to the current document.
    const remap = new Mapping(
      this.commits
        .slice(index)
        .reduce((maps, c) => maps.concat(c.maps), [] as Map[])
    )

    // Build up a transaction that includes all (inverted) steps in this
    // commit, rebased to the current document. They have to be applied
    // in reverse order.
    for (let i = commitToRevert.steps.length - 1; i >= 0; i--) {
      // The mapping is sliced to not include maps for this step and the
      // ones before it.
      const remapped = commitToRevert.steps[i].map(remap.slice(i + 1))
      if (!remapped) {
        continue
      }
      const result = tr.maybeStep(remapped)
      // If the step can be applied, add its map to our mapping
      // pipeline, so that subsequent steps are mapped over it.
      if (result.doc) {
        remap.appendMap(remapped.getMap(), i)
      }
    }

    return tr
  }

  findInBlameMap(pos: number) {
    const { blameMap } = this

    for (let i = 0; i < blameMap.length; i++) {
      const span = blameMap[i]
      if (span.commit === null) {
        continue
      }
      if (
        span.to >= pos &&
        span.from <= pos &&
        span.commit < this.commits.length &&
        !this.commits[span.commit].status
      ) {
        return blameMap[i].commit
      }
    }

    return null
  }

  decorateBlameMap(focusedCommit: number | null) {
    return this.blameMap
      .map((span) => {
        if (span.commit === null) {
          return null
        }
        if (span.commit === focusedCommit) {
          return this.createBlameDecoration(span.from, span.to, 'focused')
        }
        if (span.commit < this.commits.length) {
          if (this.commits[span.commit].status) {
            return null
          }
          return this.createBlameDecoration(span.from, span.to, 'committed')
        }
        return this.createBlameDecoration(span.from, span.to, 'uncommitted')
      })
      .filter(Boolean) as Decoration[]
  }

  createBlameDecoration(from: number, to: number, type: string) {
    if (from === to) {
      return Decoration.widget(from, () => {
        const el = document.createElement('span')
        el.classList.add(`blame-${type}-point`)
        return el
      })
    }
    return Decoration.inline(from, to, {
      class: `blame-${type}`,
    })
  }
}
