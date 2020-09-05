import { Plugin } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { trackPlugin, Commit } from './trackPlugin'
import { schema } from 'prosemirror-schema-basic'

interface PluginState {
  deco: DecorationSet
  commit: Commit | null
}

interface Highlight {
  add?: Commit | null
  clear?: Commit | null
}

export const highlightPlugin = new Plugin<PluginState, typeof schema>({
  state: {
    init() {
      return { deco: DecorationSet.empty, commit: null }
    },
    apply(tr, prev, oldState, state) {
      let highlight: Highlight = tr.getMeta(this)
      if (highlight && highlight.add && prev.commit !== highlight.add) {
        let tState = trackPlugin.getState(oldState)

        let decos = tState.blameMap
          .filter((span) => {
            if (span.commit === null) return false
            return tState.commits[span.commit] === highlight.add
          })
          .map((span) =>
            Decoration.inline(span.from, span.to, { class: 'blame-marker' })
          )

        return {
          deco: DecorationSet.create(state.doc, decos),
          commit: highlight.add,
        }
      } else if (
        highlight &&
        highlight.clear &&
        prev.commit === highlight.clear
      ) {
        return { deco: DecorationSet.empty, commit: null }
      } else if (tr.docChanged && prev.commit) {
        return { deco: prev.deco.map(tr.mapping, tr.doc), commit: prev.commit }
      } else {
        return prev
      }
    },
  },
  props: {
    decorations(state) {
      return this.getState(state).deco
    },
  },
})
