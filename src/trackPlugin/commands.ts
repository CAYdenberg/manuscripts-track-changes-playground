import { Command } from '../Editor'
import { getTrackPluginState, trackPluginKey } from './plugin'
import { TRACK_PLUGIN_ACTIONS as c } from './actions'

export const focusCommit = (commit: string): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(state.tr.setMeta(trackPluginKey, { type: c.FOCUS, commit }))
  }
  return true
}

export const freezeCommit = (): Command => (state, dispatch) => {
  const { commit } = getTrackPluginState(state)
  if (!commit.steps.length) {
    return false
  }

  if (dispatch) {
    dispatch(state.tr.setMeta(trackPluginKey, { type: c.FREEZE }))
  }

  return true
}
