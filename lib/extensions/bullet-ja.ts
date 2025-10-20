import { Extension } from "@tiptap/core"
import { InputRule } from "@tiptap/core"

export const BulletJa = Extension.create({
  name: "bulletJa",

  addInputRules() {
    return [
      new InputRule({
        find: /^・\s$/,
        handler: ({ chain, range }) => {
          // Delete the input characters and convert to bullet list
          return chain().deleteRange(range).toggleBulletList().run()
        },
      }),
    ]
  },
})
