import React, { useState } from 'react'
import { EditorState, Transaction } from 'prosemirror-state'
import { trackPlugin } from './trackPlugin'

interface Props {
  state?: EditorState
  dispatch: (tr: Transaction) => void
}

const CommitForm: React.FC<Props> = ({ state, dispatch }) => {
  if (!state) return null

  const [inputVal, setInputVal] = useState<string>('')

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    dispatch(state.tr.setMeta(trackPlugin, inputVal))
    setInputVal('')
    return false
  }

  return (
    <form id="commit" onSubmit={handleSubmit}>
      <span>Commit message:</span>
      <input
        type="text"
        id="message"
        name="message"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
      />
      <button id="commitbutton" type="submit">
        commit
      </button>
    </form>
  )
}

export default CommitForm
