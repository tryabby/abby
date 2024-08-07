import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "components/ui/dialog";
import { cn } from "lib/utils";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
  size?: "base" | "full";
  isConfirming?: boolean;
  isConfirmButtonDisabled?: boolean;
};

export const Modal = ({
  onClose,
  isOpen,
  children,
  title,
  cancelText,
  confirmText,
  onConfirm,
  size = "base",
  isConfirming = false,
  isConfirmButtonDisabled = false,
  subtitle,
}: Props) => {
  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(e) => {
        if (!e) onClose();
      }}
    >
      <DialogContent className={cn(size === "full" && "sm:max-w-[980px]")}>
        <DialogTitle> {title} </DialogTitle>
        <DialogDescription>{subtitle}</DialogDescription>
        <div className="my-6 text-pink-50">{children}</div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            {cancelText ?? "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming || isConfirmButtonDisabled}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText ?? "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
