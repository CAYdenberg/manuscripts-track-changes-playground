import { Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorState, Transaction } from 'prosemirror-state'
import { DirectEditorProps, EditorView } from 'prosemirror-view'
import { useCallback, useRef, useState } from 'react'

export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean

export type BindEditorProps = (
  doc: ProsemirrorNode,
  dispatch: (tr: Transaction) => void
) => DirectEditorProps

export default (bindEditorProps: BindEditorProps) => (doc: ProsemirrorNode) => {
  const view = useRef<EditorView>()
  const [state, setState] = useState<EditorState>()

  const dispatch = (tr: Transaction) => {
    if (!view.current) return

    const nextState = view.current.state.apply(tr)
    view.current.updateState(nextState)

    // TODO: this part should be debounced??
    setState(nextState)
  }

  const onRender = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    view.current = new EditorView(el, bindEditorProps(doc, dispatch))
    setState(view.current.state)
  }, [])

  const isCommandValid = useCallback(
    (command: Command): boolean => !!state && command(state),
    [state]
  )

  const doCommand = useCallback(
    (command: Command): boolean =>
      isCommandValid(command) && command(state!, dispatch),
    [state]
  )

  const replaceState = useCallback(
    (state: EditorState) => {
      setState(state)
      if (view.current) {
        view.current.updateState(state)
      }
    },
    [state]
  )

  return {
    state,
    onRender,
    isCommandValid,
    doCommand,
    replaceState,
  }
}
