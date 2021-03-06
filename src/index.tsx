import React, { useState } from 'react'
import ReactDOM from 'react-dom'
import CommitsList from './CommitsList'
import useEditor, { CreateView } from './useEditor'
import ExcludedCommitsList from './ExcludedCommitsList'

import { EditorState } from 'prosemirror-state'
import { exampleSetup } from 'prosemirror-example-setup'
import { schema } from 'prosemirror-schema-basic'

import trackPlugin, {
  Commit,
  findCommitWithin,
  getTrackPluginState,
  freezeCommit,
  checkout,
} from './trackPlugin'
import { newDocument } from './io'
import {
  cherryPick,
  initialCommit,
  rewindAndPlayback,
} from './trackPlugin/commit'
import { EditorView } from 'prosemirror-view'

const initialState = EditorState.create({
  doc: newDocument(),
  schema,
  plugins: exampleSetup({ schema }).concat(trackPlugin()),
})

const createView: CreateView = (el, state, dispatch) =>
  new EditorView(el, {
    state,
    dispatchTransaction: dispatch,
  })

const App: React.FC = () => {
  const {
    onRender,
    state,
    doCommand,
    isCommandValid,
    replaceState,
  } = useEditor(initialState, createView)

  const [excluded, setExcluded] = useState<Commit[]>([])

  if (!state) {
    return <div id="editor" ref={onRender}></div>
  }

  const { commit } = getTrackPluginState(state)

  const replayWithout = (without: string[]) => {
    const rejectedCommits = without
      .map(findCommitWithin(commit))
      .filter(Boolean) as Commit[]
    setExcluded((current) => current.concat(rejectedCommits))

    const { commit: next } = rewindAndPlayback(commit, without)
    replaceState(checkout(newDocument(), state, next || initialCommit()))
  }

  const replayWith = (pick: Commit) => {
    setExcluded((current) => current.filter((item) => item.id !== pick.id))

    const { commit: next } = cherryPick(pick, commit)
    replaceState(checkout(newDocument(), state, next))
  }

  return (
    <React.Fragment>
      <div id="editor" ref={onRender}></div>

      <button
        type="button"
        disabled={!isCommandValid(freezeCommit())}
        onClick={() => doCommand(freezeCommit())}
      >
        Group Changes
      </button>

      <CommitsList
        state={state}
        doCommand={doCommand}
        isCommandValid={isCommandValid}
        submit={replayWithout}
      />

      <ExcludedCommitsList excluded={excluded} replayWith={replayWith} />
    </React.Fragment>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
