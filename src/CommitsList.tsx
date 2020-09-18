import React from 'react'
import { trackPlugin } from './trackPlugin'
import { Transaction, EditorState } from 'prosemirror-state'

interface Props {
  state?: EditorState
  dispatch: (tr: Transaction) => void
}

const CommitsList: React.FC<Props> = ({ state, dispatch }) => {
  if (!state) return null

  const { tracked, deco } = trackPlugin.getState(state)
  const { commits } = tracked

  console.log(deco)

  return (
    <div>
      {commits.map((commit, i) => (
        <div
          className="commit"
          key={commit.id}
          onClick={(e) => {
            e.preventDefault()
            const { tr } = state
            tr.setMeta(trackPlugin, { type: 'FOCUS', commit: i })
            dispatch(tr)
          }}
        >
          {commit.message}
        </div>
      ))}
    </div>
  )
}

export default CommitsList
