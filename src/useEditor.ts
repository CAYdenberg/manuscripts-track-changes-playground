import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useRef, useState } from 'react'

export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean

export type CreateView = (
  element: HTMLDivElement,
  state: EditorState,
  dispatch: (tr: Transaction) => void
) => EditorView

export default (initialState: EditorState, createView: CreateView) => {
  const view = useRef<EditorView>()
  const [state, setState] = useState<EditorState>(initialState)

  const dispatch = (tr: Transaction) => {
    if (!view.current) return

    const nextState = view.current.state.apply(tr)
    view.current.updateState(nextState)

    // TODO: this part should be debounced??
    setState(nextState)
  }

  const onRender = useCallback((el: HTMLDivElement | null) => {
    if (!el) return
    view.current = createView(el, state, dispatch)
    setState(view.current.state)
  }, [])

  const isCommandValid = useCallback(
    (command: Command): boolean => command(state),
    [state]
  )

  const doCommand = useCallback(
    (command: Command): boolean => command(state, dispatch),
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
    // ordinary use:
    state,
    onRender,
    isCommandValid,
    doCommand,
    replaceState,

    // advanced use:
    view: view.current,
    dispatch,
  }
}
