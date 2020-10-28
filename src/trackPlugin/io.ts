import { Step } from 'prosemirror-transform'
import { Commit } from './commit'
import { schema } from 'prosemirror-schema-basic'
import { Span } from './blame'

interface JsonableCommit {
  steps: Array<{ [key: string]: unknown }>
  prev: JsonableCommit | null
  id: string
  blame: Span[]
}

const commitToJsonable = (commit: Commit): JsonableCommit => {
  return {
    ...commit,
    steps: commit.steps.map((step) => step.toJSON()),
    prev: commit.prev && commitToJsonable(commit.prev),
  }
}

export const commitToJSON = (commit: Commit): string => {
  return JSON.stringify(commitToJsonable(commit))
}

export const commitFromJSON = (json: string | Commit): Commit => {
  if (typeof json === 'string') {
    return commitFromJSON(JSON.parse(json))
  }

  return {
    id: json.id,
    blame: json.blame,
    prev: json.prev ? commitFromJSON(json.prev) : null,
    steps: json.steps.map((step) => Step.fromJSON(schema, step)),
  }
}
