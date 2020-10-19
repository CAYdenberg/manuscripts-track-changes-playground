import { Mapping } from 'prosemirror-transform'
import { Decoration } from 'prosemirror-view'

export interface Span {
  from: number
  to: number
  commit: string
}

const insertIntoBlameMap = (
  map: Span[],
  from: number,
  to: number,
  commit: string
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
        const left = { from, to, commit: next.commit }
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
      map[pos] = { from: to, to: next.to, commit: next.commit }
      break
    } else {
      map.splice(pos, 1)
    }
  }

  map.splice(pos, 0, { from, to, commit })
}

export const updateBlame = (blame: Span[], mapping: Mapping, id: string) => {
  const result: Span[] = []

  for (let i = 0; i < blame.length; i++) {
    const span = blame[i]
    const from = mapping.map(span.from, 1)
    const to = mapping.map(span.to, -1)
    if (from <= to) {
      result.push({ from, to, commit: span.commit })
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

const createBlameDecoration = (from: number, to: number, type?: string) => {
  if (from === to) {
    return Decoration.widget(from, () => {
      const el = document.createElement('span')
      el.classList.add(['blame', type, 'point'].filter(Boolean).join('-'))
      return el
    })
  }
  return Decoration.inline(from, to, {
    class: ['blame', type].filter(Boolean).join('-'),
  })
}

export const decorateBlame = (
  blame: Span[],
  classNames: Array<[id: string | null, className: string]>
) => {
  return blame
    .map((span) => {
      if (span.commit === null) {
        return null
      }
      const className = classNames.find((n) => n[0] && n[0] === span.commit)
      if (!className) {
        return createBlameDecoration(span.from, span.to)
      }
      return createBlameDecoration(span.from, span.to, className[1])
    })
    .filter(Boolean) as Decoration[]
}

export const findInBlame = (blame: Span[], pos: number): string | null => {
  for (let i = 0; i < blame.length; i++) {
    const span = blame[i]
    if (span.commit === null) {
      continue
    }
    if (span.to >= pos && span.from <= pos) {
      return blame[i].commit
    }
  }

  return null
}
