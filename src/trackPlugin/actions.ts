import { TrackPluginState } from './plugin'

export enum TRACK_PLUGIN_ACTIONS {
  COMMIT = 'COMMIT',
  FOCUS = 'FOCUS',
  REVERT = 'REVERT',
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
    case TRACK_PLUGIN_ACTIONS.COMMIT: {
      return {
        ...state,
        tracked: state.tracked.applyCommit(action.message),
      }
    }
    case TRACK_PLUGIN_ACTIONS.FOCUS: {
      return {
        ...state,
        focusedCommit: action.commit,
      }
    }
    case TRACK_PLUGIN_ACTIONS.REVERT: {
      return {
        ...state,
        tracked: state.tracked.revertCommit(action.commit),
      }
    }
    default: {
      return state
    }
  }
}
