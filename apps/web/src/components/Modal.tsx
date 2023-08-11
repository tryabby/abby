import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { Fragment, useRef } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button";

type Props = {
  onClose: () => void;
  isOpen: boolean;
  children: React.ReactNode;
  title: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
  initialFocusRef?: React.RefObject<HTMLElement>;
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
  initialFocusRef,
  size = "base",
  isConfirming = false,
  isConfirmButtonDisabled = false,
}: Props) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        open={isOpen}
        onClose={onClose}
        initialFocus={initialFocusRef ?? cancelButtonRef}
        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
          if (e.key === "Enter" && e.metaKey) {
            handleConfirm();
          }
        }}
        className="relative z-50"
      >
        {/* The backdrop, rendered as a fixed sibling to the panel container */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" />
        </Transition.Child>
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={twMerge(
                  "relative transform overflow-hidden rounded-lg bg-gray-700 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg",
                  clsx(size === "full" && "sm:max-w-[980px]")
                )}
              >
                <div className="bg-gray-700 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-2xl font-medium leading-6 text-pink-50"
                      >
                        {title}
                      </Dialog.Title>
                      <div className="mt-6 text-pink-50">{children}</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-600 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <Button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-transparent bg-pink-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-80 disabled:hover:bg-pink-600 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleConfirm}
                    disabled={isConfirming || isConfirmButtonDisabled}
                  >
                    {isConfirming && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {confirmText ?? "Confirm"}
                  </Button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-500 bg-gray-700 px-4 py-2 text-base font-medium text-white shadow-sm outline-none hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                    ref={cancelButtonRef}
                  >
                    {cancelText ?? "Cancel"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
