import React, { useState } from 'react'
import { EditorState } from 'prosemirror-state'
import { Command } from './Editor'
import { commit } from './trackPlugin'

interface Props {
  state?: EditorState
  doCommand: (command: Command) => void
  isCommand: (command: Command) => boolean
}

const CommitForm: React.FC<Props> = ({ state, doCommand, isCommand }) => {
  if (!state) return null

  const [inputVal, setInputVal] = useState<string>('')

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    doCommand(commit(inputVal))
    setInputVal('')
    return false
  }

  return (
    <form id="commit" onSubmit={handleSubmit}>
      <span>Edit comment:</span>
      <input
        type="text"
        id="message"
        name="message"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />
      <button
        id="commitbutton"
        type="submit"
        disabled={!isCommand(commit(inputVal))}
      >
        submit
      </button>
    </form>
  )
}

export default CommitForm
