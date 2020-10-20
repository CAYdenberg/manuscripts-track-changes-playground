import React from 'react'
import { EditorState } from 'prosemirror-state'
import { focusCommit, getTrackPluginState } from './trackPlugin'
import { Command } from './Editor'

interface Props {
  state: EditorState
  doCommand: (command: Command) => void
  isCommand: (command: Command) => boolean
}

const CommitsList: React.FC<Props> = ({ state, doCommand, isCommand }) => {
  const { tracked } = getTrackPluginState(state)
  const { commits } = tracked

  return (
    <div>
      {commits.map((commit, i) => {
        if (commit.status) {
          return null
        }

        return (
          <div
            className="commit"
            key={commit.id}
            onClick={(e) => {
              e.preventDefault()
              doCommand(focusCommit(i))
            }}
          >
            {commit.id}
          </div>
        )
      })}
    </div>
  )
}

export default CommitsList
