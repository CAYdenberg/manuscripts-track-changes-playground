import { schema } from 'prosemirror-schema-basic'

export const newDocument = () => {
  return schema.nodes.doc.create({}, [
    schema.nodes.paragraph.create({}, [
      schema.text(
        'This is the initial state of the document before any edits have been made.'
      ),
    ]),
  ])
}
