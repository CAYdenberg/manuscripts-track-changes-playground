/*!
 * © 2019 Atypon Systems LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  EditorState,
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
} from 'prosemirror-state'
import { DecorationSet } from 'prosemirror-view'
import applyAction from './actions'
import { decorateBlame, findInBlame } from './blame'
import { applyTransform, Commit, initialCommit, smoosh } from './commit'

export const isTextSelection = (
  selection: Selection
): selection is TextSelection => selection instanceof TextSelection

export interface TrackPluginState {
  commit: Commit
  deco: DecorationSet
  focusedCommit: string | null
}

export const trackPluginKey = new PluginKey('track-changes-plugin')

export default () => {
  const trackPlugin: Plugin<TrackPluginState> = new Plugin({
    key: trackPluginKey,

    state: {
      init(_, instance): TrackPluginState {
        return {
          commit: initialCommit(),
          deco: DecorationSet.empty,
          focusedCommit: null,
        }
      },

      apply(tr, state: TrackPluginState, _, editorState) {
        const { selection } = editorState
        const action = tr.getMeta(trackPluginKey)

        // FIRST update the TrackState object
        // THEN apply specific commands relating to this plugin
        const nextState = applyAction(
          {
            ...state,
            commit: tr.docChanged
              ? applyTransform(state.commit, tr)
              : state.commit,
          },
          action
        )

        const { commit } = nextState

        // FINALLY recalculate the decorations based on this new state
        const focusedCommit =
          isTextSelection(selection) && !action
            ? findInBlame(commit.blame, selection.head)
            : nextState.focusedCommit

        const deco = DecorationSet.create(
          editorState.doc,
          decorateBlame(nextState.commit.blame, [
            [commit.id, 'uncommitted'],
            [focusedCommit, 'focused'],
          ])
        )

        return {
          ...nextState,
          deco,
          focusedCommit,
        }
      },
    },
    props: {
      decorations(state) {
        return trackPluginKey.getState(state).deco
      },
    },
  })

  return trackPlugin
}

export const getTrackPluginState = (state: EditorState) =>
  trackPluginKey.getState(state) as TrackPluginState

export const getCommitsList = (state: EditorState) => {
  const { commit } = getTrackPluginState(state)
  return smoosh(commit, (c) => c.id)
}

export const findCommitWithin = (commit: Commit) => (
  id: string
): Commit | null => {
  if (commit.id === id) return commit
  if (!commit.prev) return null
  return findCommitWithin(commit.prev)(id)
}

// export const findCommit = (id: string) => (state: EditorState) => {
//   const { commit } = getTrackPluginState(state)

//   return Object.keys(branches).reduce((found, k) => {
//     if (found) return found
//     return findCommitWithin(id, branches[k])
//   }, findCommitWithin(id, commit))
// }
