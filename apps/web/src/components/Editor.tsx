import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type Props = {
  className?: string;
  content?: string;
  onUpdate?: (html: string) => void;
};

export const Editor = ({ className, content, onUpdate }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside ml-4",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside ml-4",
          },
        },
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose-invert prose-base my-5 focus:outline-none border-pink-50/60 border rounded-lg py-3 px-2",
      },
    },
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  const getBubbleMenuButtonClass = ({
    type,
    position = "center",
  }: {
    type: string;
    position: "left" | "center" | "right";
  }) =>
    twMerge(
      "bg-pink-600 px-3 py-1 text-white hover:bg-pink-500",
      clsx(editor?.isActive(type) && "bg-pink-500 hover:bg-pink-600", {
        "rounded-l-md": position === "left",
        "rounded-r-md": position === "right",
        "rounded-md": position === "center",
      })
    );

  return (
    <>
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="divide-x shadow-2xl"
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={getBubbleMenuButtonClass({
              position: "left",
              type: "bold",
            })}
          >
            bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={getBubbleMenuButtonClass({
              position: "right",
              type: "italic",
            })}
          >
            italic
          </button>
        </BubbleMenu>
      )}
      <EditorContent className={className} editor={editor} />
    </>
  );
};
