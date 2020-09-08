import { EditorState, Transaction } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { useCallback, useRef, useState } from 'react'
import { exampleSetup } from 'prosemirror-example-setup'
import { schema } from 'prosemirror-schema-basic'

import { trackPlugin } from './trackPlugin'
import { highlightPlugin } from './highlightPlugin'

import { newDocument } from './io'

export default () => {
  const view = useRef<EditorView>()
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

    const state = EditorState.create({
      doc: newDocument(),
      schema,
      plugins: exampleSetup({ schema }).concat(trackPlugin, highlightPlugin),
    })
    setState(state)

    view.current = new EditorView(dom, {
      state: state,
      dispatchTransaction: dispatch,
    })
  }, [])

  return {
    state,
    dispatch,
    onRender,
  }
}
