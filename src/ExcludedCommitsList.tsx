import React from 'react'
import { Commit } from './trackPlugin'

interface Props {
  excluded: Commit[]
  replayWith: (commit: Commit) => void
}

const ExcludedCommitsList: React.FC<Props> = ({ excluded, replayWith }) => {
  return (
    <div>
      <h2>Rejected changes:</h2>
      <ul>
        {excluded.map((commit) => (
          <li key={commit.id}>
            {commit.id}{' '}
            <button type="button" onClick={() => replayWith(commit)}>
              Accept
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ExcludedCommitsList
