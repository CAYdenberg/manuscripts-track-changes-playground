import React from 'react'
import { trackPlugin } from './trackPlugin'
import { Transaction, EditorState } from 'prosemirror-state'
import { highlightPlugin } from './highlightPlugin'

interface Props {
  state?: EditorState
  dispatch: (tr: Transaction) => void
}

const CommitsList: React.FC<Props> = ({ state, dispatch }) => {
  if (!state) return null

  const { commits } = trackPlugin.getState(state)

  return (
    <div>
      {commits.map((commit, i) => (
        <div
          className="commit"
          key={commit.message}
          // onMouseOver={() => {
          //   dispatch(state.tr.setMeta(highlightPlugin, { add: commit }))
          // }}
          // onMouseOut={() => {
          //   dispatch(state.tr.setMeta(highlightPlugin, { clear: commit }))
          // }}
        >
          {commit.message}
        </div>
      ))}
    </div>
  )
}

export default CommitsList
