import TextAlign from "@tiptap/extension-text-align";
import {
  EditorContent,
  type Editor as TipTapEditor,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import clsx from "clsx";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Heading1, Heading2, Heading3, Italic, Pilcrow, Strikethrough } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

type Props = {
  className?: string;
  content?: string;
  onUpdate?: (html: string) => void;
};

const getMenuButtonClass = ({
  roundCorners = "none",
  isActive = false,
}: {
  roundCorners?: "left" | "both" | "right" | "none";
  isActive: boolean;
}) =>
  twMerge(
    "bg-primary px-3 py-1 text-primary-foreground hover:bg-pink-500 hover:text-white",
    clsx(isActive && "bg-pink-600 text-white", {
      "rounded-l-md": roundCorners === "left",
      "rounded-r-md": roundCorners === "right",
      "rounded-md": roundCorners === "both",
      "": roundCorners === "none",
    })
  );

const MenuBar = ({ editor }: { editor: TipTapEditor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex divide-x-[1px] divide-ab_primary-background">
      <Tooltip>
        <TooltipContent>
          <span>Heading 1</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={getMenuButtonClass({
              roundCorners: "left",
              isActive: editor.isActive("heading", { level: 1 }),
            })}
          >
            <Heading1 />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Heading 2</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("heading", { level: 2 }),
            })}
          >
            <Heading2 />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Heading 3</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("heading", { level: 3 }),
            })}
          >
            <Heading3 />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Text</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("paragraph"),
            })}
          >
            <Pilcrow />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <span className="p-2 bg-primary"></span>
      <Tooltip>
        <TooltipContent>
          <span>Bold</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("bold"),
            })}
          >
            <Bold />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Italic</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("italic"),
            })}
          >
            <Italic />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Strikethrough</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={getMenuButtonClass({
              isActive: editor.isActive("strike"),
            })}
          >
            <Strikethrough />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <span className="p-2 bg-primary"></span>
      <Tooltip>
        <TooltipContent>
          <span>Align Left</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={getMenuButtonClass({
              isActive: editor.isActive({ textAlign: "left" }),
            })}
          >
            <AlignLeft />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Align Center</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={getMenuButtonClass({
              isActive: editor.isActive({ textAlign: "center" }),
            })}
          >
            <AlignCenter />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Align Right</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={getMenuButtonClass({
              isActive: editor.isActive({ textAlign: "right" }),
            })}
          >
            <AlignRight />
          </button>
        </TooltipTrigger>
      </Tooltip>
      <Tooltip>
        <TooltipContent>
          <span>Align Justify</span>
        </TooltipContent>

        <TooltipTrigger asChild>
          <button
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className={getMenuButtonClass({
              isActive: editor.isActive({ textAlign: "justify" }),
              roundCorners: "right",
            })}
          >
            <AlignJustify />
          </button>
        </TooltipTrigger>
      </Tooltip>
    </div>
  );
};

export const Editor = ({ className, content, onUpdate }: Props) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal list-outside",
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: "list-disc list-outside",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "prose-invert prose-base leading-none my-5 focus:outline-none border-pink-50/60 border rounded-lg py-3 px-2 h-64 overflow-y-auto",
      },
    },
    content,
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
  });

  return (
    <>
      <MenuBar editor={editor} />
      <div className="h-64">
        <EditorContent className={className} editor={editor} />
      </div>
    </>
  );
};
