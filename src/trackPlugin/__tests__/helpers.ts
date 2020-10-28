import { Fragment, Slice } from 'prosemirror-model'
import { Step } from 'prosemirror-transform'
import { EditorState } from 'prosemirror-state'
import { schema } from 'prosemirror-schema-basic'
import { newDocument } from '../../io'
import { Span } from '../blame'

export const initialState = () => {
  return EditorState.create({
    doc: newDocument(),
    schema,
  })
}

export const typeSomething = (
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

export const applyTr = (initialState: EditorState, steps: Step[]) => {
  let { tr } = initialState
  steps.forEach((step) => {
    tr.step(step)
  })
  return initialState.apply(tr)
}

export const blameRemoveUUIDS = (blame: Span[]) =>
  blame
    .map((span) => {
      if (!span.commit) return null
      return { from: span.from, to: span.to }
    })
    .filter(Boolean) as Span[]
