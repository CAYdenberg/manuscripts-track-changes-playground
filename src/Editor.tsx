import React, { useCallback, useRef } from 'react'
import { EditorState, Transaction } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { schema } from 'prosemirror-schema-basic'
import { exampleSetup } from 'prosemirror-example-setup'

interface Props {
  onChange: (state: EditorState) => void
}

const Editor: React.FC<Props> = ({ onChange }) => {
  const view = useRef<EditorView>()

  const onRender = useCallback((dom: HTMLDivElement | null) => {
    // TODO: this should be debounced
    const dispatch = (tr: Transaction) => {
      if (!view.current) return

      const nextState = view.current.state.apply(tr)
      view.current.updateState(nextState)
      onChange(nextState)
    }

    if (!dom) return

    const state = EditorState.create({
      schema,
      plugins: exampleSetup({ schema }).concat(),
    })

    view.current = new EditorView(dom, {
      state: state,
      dispatchTransaction: dispatch,
    })
    onChange(state)
  }, [])

  return <div id="editor" ref={onRender}></div>
}

export default Editor
