import React, { useCallback, useState } from 'react'
import { EditorState } from 'prosemirror-state'
import { focusCommit, getCommitsList } from './trackPlugin'
import { Command } from './Editor'

interface Props {
  state: EditorState
  doCommand: (command: Command) => void
  isCommandValid: (command: Command) => boolean
  submit: (commits: string[]) => void
}

const CommitsList: React.FC<Props> = ({ state, doCommand, submit }) => {
  const list = getCommitsList(state)

  const [incCommits, setIncCommits] = useState<string[]>([])
  const toggleCommit = useCallback((commit: string) => {
    setIncCommits((commits) => {
      return commits.includes(commit)
        ? commits.filter((c) => c !== commit)
        : commits.concat(commit)
    })
  }, [])

  return (
    <div>
      <strong>Exclude:</strong>
      {list.map((id, i) => {
        return (
          <div className="commit" key={id}>
            <label>
              <input
                type="checkbox"
                checked={incCommits.includes(id)}
                onChange={() => toggleCommit(id)}
              />
              {id}
            </label>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                doCommand(focusCommit(id))
              }}
              disabled={i >= list.length - 1}
            >
              Highlight
            </button>
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => {
          submit(incCommits)
          setIncCommits([])
        }}
      >
        Rewind and Playback
      </button>
    </div>
  )
}

export default CommitsList
