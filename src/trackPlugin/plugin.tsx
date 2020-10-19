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
import Span from './span'
import Tracked from './tracked'
import applyAction, { TRACK_PLUGIN_ACTIONS } from './actions'

export const isTextSelection = (
  selection: Selection
): selection is TextSelection => selection instanceof TextSelection

export interface TrackPluginState {
  tracked: Tracked
  deco: DecorationSet
  focusedCommit: number | null
}

export const trackPluginKey = new PluginKey('track-changes-plugin')

export const getTrackPluginState = (state: EditorState) =>
  trackPluginKey.getState(state) as TrackPluginState

export default () => {
  const trackPlugin: Plugin<TrackPluginState> = new Plugin({
    key: trackPluginKey,

    state: {
      init(_, instance): TrackPluginState {
        return {
          tracked: new Tracked([new Span(0, instance.doc.content.size, null)]),
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
            tracked: tr.docChanged
              ? state.tracked.applyTransform(tr)
              : state.tracked,
          },
          action
        )

        // FINALLY recalculate the decorations based on this new state
        const focusedCommit =
          isTextSelection(selection) && !action
            ? nextState.tracked.findInBlameMap(selection.head)
            : nextState.focusedCommit

        const deco = DecorationSet.create(
          editorState.doc,
          nextState.tracked.decorateBlameMap(focusedCommit)
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
    appendTransaction(trs, _, newState) {
      const revert = trs.find((tr) => {
        const action = tr.getMeta(trackPluginKey)
        return action && action.type === TRACK_PLUGIN_ACTIONS.REVERT
      })
      if (!revert) {
        return
      }

      const { tracked } = trackPluginKey.getState(newState)
      const revertTr = tracked.getRevertTr(
        revert.getMeta(trackPluginKey).commit,
        revert
      )

      return revertTr.docChanged ? revertTr : undefined
    },
  })

  return trackPlugin
}
