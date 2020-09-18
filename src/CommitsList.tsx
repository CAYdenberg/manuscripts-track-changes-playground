import React from 'react'
import { trackPlugin } from './trackPlugin'
import { Transaction, EditorState } from 'prosemirror-state'

interface Props {
  state?: EditorState
  dispatch: (tr: Transaction) => void
}

const CommitsList: React.FC<Props> = ({ state, dispatch }) => {
  if (!state) return null

  const { tracked } = trackPlugin.getState(state)
  const { commits } = tracked
  console.log(commits)

  return (
    <div>
      {commits.map((commit) => (
        <div
          className="commit"
          key={commit.id}
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
