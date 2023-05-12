import { useState } from "react";
import { AiOutlineEdit, AiOutlineSave } from "react-icons/ai";
import { IconButton } from "./IconButton";

type Props = {
  title: string;
  onSave: (title: string) => void | Promise<void>;
};

export function TitleEdit({ onSave, title }: Props) {
  const [value, setValue] = useState(title);
  const [isTitleInEdit, setIsTitleInEdit] = useState(false);

  const updateTitle = async () => {
    setIsTitleInEdit(false);
    await onSave(value);
  };
  return (
    <div className="flex items-center space-x-2">
      {isTitleInEdit ? (
        <>
          <input
            type="text"
            className="rounded-md bg-gray-700/50 p-2"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.metaKey) {
                updateTitle();
              }
            }}
          />
          <IconButton
            title="Save"
            className="bg-transparent"
            icon={<AiOutlineSave />}
            onClick={updateTitle}
          />
        </>
      ) : (
        <>
          <h2 className="font-bold text-pink-200">{value}</h2>
          <IconButton
            title="Edit"
            className="bg-transparent"
            icon={<AiOutlineEdit />}
            onClick={() => setIsTitleInEdit(true)}
          />
        </>
      )}
    </div>
  );
}
