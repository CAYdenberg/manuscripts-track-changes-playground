import { Command } from '../Editor'
import { getTrackPluginState, trackPluginKey } from './plugin'
import { TRACK_PLUGIN_ACTIONS as c } from './actions'

export const focusCommit = (commit: number): Command => (state, dispatch) => {
  if (dispatch) {
    dispatch(state.tr.setMeta(trackPluginKey, { type: c.FOCUS, commit }))
  }
  return true
}

export const commit = (message: string): Command => (state, dispatch) => {
  const { tracked } = getTrackPluginState(state)
  if (!tracked.uncommittedSteps.length) {
    return false
  }

  if (dispatch) {
    dispatch(state.tr.setMeta(trackPluginKey, { type: c.COMMIT, message }))
  }

  return true
}

export const revertCommit = (commit: number): Command => (state, dispatch) => {
  const { tracked } = getTrackPluginState(state)
  if (tracked.uncommittedSteps.length) {
    return false
  }

  if (dispatch) {
    dispatch(state.tr.setMeta(trackPluginKey, { type: c.REVERT, commit }))
  }

  return true
}
