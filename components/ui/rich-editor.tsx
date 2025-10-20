"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Placeholder } from "@tiptap/extension-placeholder"
import { TextAlign } from "@tiptap/extension-text-align"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react"
import { useRef } from "react"
import { cn } from "@/lib/utils"

interface RichEditorProps {
  content?: string
  onChange?: (content: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function RichEditor({
  content = "",
  onChange,
  onBlur,
  placeholder = "Start writing...",
  className,
  editable = true,
}: RichEditorProps) {
  const isUpdatingFromProps = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: false,
        orderedList: false,
        blockquote: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      if (!isUpdatingFromProps.current) {
        onChange?.(editor.getHTML())
      }
    },
    onBlur: () => {
      onBlur?.()
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          "prose-headings:font-bold prose-headings:text-foreground prose-headings:mt-4 prose-headings:mb-2",
          "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
          "prose-p:text-foreground prose-p:leading-relaxed prose-p:my-2",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground prose-em:italic",
          "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded",
          "min-h-[260px] p-4",
          className,
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  if (!editable) {
    return (
      <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="border rounded-md p-2 bg-background">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <Toggle
            size="sm"
            pressed={editor.isActive("bold")}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("italic")}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("strike")}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("code")}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive("heading", { level: 3 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Alignment */}
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "left" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
          >
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "center" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
          >
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "right" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
          >
            <AlignRight className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive({ textAlign: "justify" })}
            onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
          >
            <AlignJustify className="h-4 w-4" />
          </Toggle>

          <Separator orientation="vertical" className="h-6" />

          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="border-2 border-border rounded-md bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
