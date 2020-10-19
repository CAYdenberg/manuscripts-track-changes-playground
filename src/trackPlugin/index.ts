export type { Commit } from './commit'
export { findCommitWithin, getCommitsList, getTrackPluginState } from './plugin'
export { focusCommit, freezeCommit } from './commands'
export { checkout } from './checkout'

import plugin from './plugin'
export default plugin
