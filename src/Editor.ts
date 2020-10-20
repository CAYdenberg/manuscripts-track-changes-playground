import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useRef, useState } from 'react'
import { newDocument } from './io'
import { replay } from './trackPlugin'

export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean

export default (initialState: EditorState) => () => {
  const view = useRef<EditorView>()
  const el = useRef<HTMLDivElement>()
  const [state, setState] = useState<EditorState>()

  // TODO: this should be debounced
  const dispatch = (tr: Transaction) => {
    if (!view.current) return

    const nextState = view.current.state.apply(tr)
    view.current.updateState(nextState)
    setState(nextState)
  }

  const onRender = useCallback((dom: HTMLDivElement | null) => {
    if (!dom) return
    el.current = dom
    setState(initialState)
    view.current = new EditorView(dom, {
      state: initialState,
      dispatchTransaction: dispatch,
    })
  }, [])

  const isCommand = useCallback(
    (command: Command): boolean => !!state && command(state),
    [state]
  )

  const doCommand = useCallback(
    (command: Command): boolean =>
      isCommand(command) && command(state!, dispatch),
    [state]
  )

  const replayCommits = useCallback(
    (commits: number[]) => {
      if (!state) return

      const nextState = replay(newDocument(), state, commits)

      setState(nextState)
      if (view.current) {
        view.current.updateState(nextState)
      }
    },
    [state]
  )

  return {
    state,
    dispatch,
    onRender,
    isCommand,
    doCommand,
    replayCommits,
  }
}
