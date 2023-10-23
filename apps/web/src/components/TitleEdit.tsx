import { useState } from "react";
import { AiOutlineEdit, AiOutlineSave } from "react-icons/ai";
import { Button } from "./ui/button";

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
            className="rounded-lg border-border bg-background"
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
          <Button
            title="Save"
            className="bg-transparent"
            onClick={updateTitle}
            variant="ghost"
          >
            <AiOutlineSave />
          </Button>
        </>
      ) : (
        <>
          <h2 className="font-bold text-primary">{value}</h2>
          <Button
            size="icon"
            title="Save"
            variant="ghost"
            onClick={() => setIsTitleInEdit(true)}
          >
            <AiOutlineEdit />
          </Button>
        </>
      )}
    </div>
  );
}
