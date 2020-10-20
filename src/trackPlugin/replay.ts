import { Node as ProsemirrorNode } from 'prosemirror-model'
import { EditorState } from 'prosemirror-state'
import { TRACK_PLUGIN_ACTIONS } from './actions'
import { getTrackPluginState, trackPluginKey } from './plugin'

export const replay = (
  ancestorDocument: ProsemirrorNode,
  currentState: EditorState,
  commits?: number[]
): EditorState => {
  const { tracked } = getTrackPluginState(currentState)
  const temporaryState = EditorState.create({
    doc: ancestorDocument,
    schema: currentState.schema,
    plugins: currentState.plugins,
  })

  const { tr } = temporaryState
  const nextTracked = commits ? tracked.replay(commits) : tracked

  tr.setMeta(trackPluginKey, {
    type: TRACK_PLUGIN_ACTIONS.REPLACE,
    tracked: nextTracked,
  })
  tr.setMeta('addToHistory', false)

  // replay all the steps
  nextTracked.commits.forEach((commit, i) => {
    if (commit.status === 'rejected') return
    commit.steps.forEach((step) => {
      tr.step(step)
    })
  })

  // remap the selection

  const nextState = temporaryState.apply(tr)

  return nextState
}
