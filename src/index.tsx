import React from 'react'
import ReactDOM from 'react-dom'
import CommitForm from './CommitForm'
import CommitsList from './CommitsList'
import useEditor from './useEditor'
import { trackPlugin } from './trackPlugin'

const App: React.FC = () => {
  const { onRender, state, dispatch } = useEditor()

  return (
    <React.Fragment>
      <div id="editor" ref={onRender}></div>

      <CommitForm state={state} dispatch={dispatch} />

      {state && <CommitsList commits={trackPlugin.getState(state).commits} />}
    </React.Fragment>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
