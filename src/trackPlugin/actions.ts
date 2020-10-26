import { freeze } from './commit'
import { TrackPluginState } from './plugin'

export enum TRACK_PLUGIN_ACTIONS {
  FREEZE = 'FREEZE',
  FOCUS = 'FOCUS',
  REPLACE = 'REPLACE',
}

export default (
  state: TrackPluginState,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  action?: { type: string; [key: string]: any }
): TrackPluginState => {
  if (!action) {
    return state
  }

  switch (action.type) {
    case TRACK_PLUGIN_ACTIONS.FREEZE: {
      return {
        ...state,
        commit: freeze(state.commit),
      }
    }
    case TRACK_PLUGIN_ACTIONS.FOCUS: {
      return {
        ...state,
        focusedCommit: action.commit,
      }
    }
    case TRACK_PLUGIN_ACTIONS.REPLACE: {
      return {
        ...state,
        commit: action.commit,
      }
    }
    default: {
      return state
    }
  }
}
