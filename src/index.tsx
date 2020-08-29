import React, { useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { EditorState } from 'prosemirror-state'
import Editor from './Editor'

const App: React.FC = () => {
  const [state, setState] = useState<EditorState>()
  console.log(state && state.selection.from)

  return (
    <React.Fragment>
      <Editor onChange={setState} />
      <form id="commit">
        <span>Commit message:</span>
        <input type="text" id="message" name="message" />
        <button id="commitbutton" type="submit">
          commit
        </button>
        <div className="blame-wrap">
          <button type="button" id="blame">
            blame at cursor
          </button>
        </div>
      </form>

      <div id="commits" style={{ marginBottom: 23 }}></div>
    </React.Fragment>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
