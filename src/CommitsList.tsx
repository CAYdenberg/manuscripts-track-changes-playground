import React from 'react'
import { EditorState } from 'prosemirror-state'
import { focusCommit, getTrackPluginState, revertCommit } from './trackPlugin'
import { Command } from './Editor'

interface Props {
  state?: EditorState
  doCommand: (command: Command) => void
  isCommand: (command: Command) => boolean
}

const CommitsList: React.FC<Props> = ({ state, doCommand, isCommand }) => {
  if (!state) return null

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
            {commit.message}
            <button
              type="button"
              onClick={(e) => {
                // do NOT attempt to highlight the commit we are about to revert
                e.preventDefault()
                e.stopPropagation()
                doCommand(revertCommit(i))
              }}
              disabled={!isCommand(revertCommit(i))}
            >
              Revert
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default CommitsList
