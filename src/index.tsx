import React from 'react'
import ReactDOM from 'react-dom'
import CommitForm from './CommitForm'
import CommitsList from './CommitsList'
import useEditor from './useEditor'

const App: React.FC = () => {
  const { onRender, state, dispatch } = useEditor()

  return (
    <React.Fragment>
      <div id="editor" ref={onRender}></div>

      <CommitForm state={state} dispatch={dispatch} />

      <CommitsList state={state} dispatch={dispatch} />
    </React.Fragment>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
