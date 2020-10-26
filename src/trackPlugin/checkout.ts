import { Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { Step } from 'prosemirror-transform'
import { TRACK_PLUGIN_ACTIONS } from './actions'
import { Commit, freeze, smoosh } from './commit'
import { trackPluginKey } from './plugin'

export const checkout = (
  ancestorDocument: ProsemirrorNode,
  currentState: EditorState,
  commit: Commit
): EditorState => {
  // if the passed commit contains steps, then freeze it before allowing
  // more changes
  if (commit.steps.length) {
    commit = freeze(commit)
  }

  const temporaryState = EditorState.create({
    doc: ancestorDocument,
    schema: currentState.schema,
    plugins: currentState.plugins,
  })

  const { tr } = temporaryState

  tr.setMeta(trackPluginKey, {
    type: TRACK_PLUGIN_ACTIONS.REPLACE,
    commit,
  })
  tr.setMeta('addToHistory', false)

  const allSteps = smoosh<Step>(commit, (c) => c.steps)
  // replay all the steps
  allSteps.forEach((step) => tr.maybeStep(step))

  // remap the selection

  const nextState = temporaryState.apply(tr)

  return nextState
}
