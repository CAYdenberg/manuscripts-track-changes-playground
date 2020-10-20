import React from 'react'
import { EditorState } from 'prosemirror-state'
import { Command } from './Editor'
import { commit } from './trackPlugin'

interface Props {
  state: EditorState
  doCommand: (command: Command) => void
  isCommand: (command: Command) => boolean
}

const CommitForm: React.FC<Props> = ({ state, doCommand, isCommand }) => {
  const handleClick = (e: React.SyntheticEvent) => {
    e.preventDefault()
    doCommand(commit())
    return false
  }

  return (
    <button
      id="commitbutton"
      type="button"
      disabled={!isCommand(commit())}
      onClick={handleClick}
    >
      Group changes
    </button>
  )
}

export default CommitForm
