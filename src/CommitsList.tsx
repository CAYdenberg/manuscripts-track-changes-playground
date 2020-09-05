import React from 'react'
import { Commit } from './Editor'

interface Props {
  commits: Commit[]
}

const CommitsList: React.FC<Props> = ({ commits }) => (
  <div>
    {commits.map((commit) => (
      <div className="commit" key={commit.time.toUTCString()}>
        {commit.message}
      </div>
    ))}
  </div>
)

export default CommitsList
