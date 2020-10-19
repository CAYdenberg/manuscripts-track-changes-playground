import React from 'react'
import ReactDOM from 'react-dom'
import CommitForm from './CommitForm'
import CommitsList from './CommitsList'
import Editor from './Editor'

import { EditorState } from 'prosemirror-state'
import { exampleSetup } from 'prosemirror-example-setup'
import { schema } from 'prosemirror-schema-basic'

import trackPlugin from './trackPlugin/plugin'
import { newDocument } from './io'

const useEditor = Editor(
  EditorState.create({
    doc: newDocument(),
    schema,
    plugins: exampleSetup({ schema }).concat(trackPlugin()),
  })
)

const App: React.FC = () => {
  const { onRender, state, doCommand, isCommand } = useEditor()

  return (
    <React.Fragment>
      <div id="editor" ref={onRender}></div>

      <CommitForm state={state} doCommand={doCommand} isCommand={isCommand} />

      <CommitsList state={state} doCommand={doCommand} isCommand={isCommand} />
    </React.Fragment>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
