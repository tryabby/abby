import { Listbox, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";
import { AiOutlineCheck } from "react-icons/ai";
import { HiOutlineSelector } from "react-icons/hi";
import { LoadingSpinner } from "./LoadingSpinner";

export type SelectItem = {
  label: string;
  value: string;
};

type ArrayLike<T> = Array<T> | ReadonlyArray<T>;

type Props = {
  items: ArrayLike<SelectItem>;
  value: SelectItem["value"];
  onChange: (value: SelectItem["value"]) => void;
  isLoading?: boolean;
  label?: string;
};

export function Select({ items, onChange, value, isLoading, label }: Props) {
  const currentItem = items.find((item) => item.value === value);
  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <>
          {label && (
            <Listbox.Label className="block text-sm font-medium">
              {label}
            </Listbox.Label>
          )}
          <div className="relative mt-1">
            <Listbox.Button className="font relative w-full cursor-default rounded-md border border-gray-600 bg-gray-800 py-2 pl-3 pr-10 text-left font-semibold shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <span className="ml-3 block truncate">
                  {currentItem?.label}
                </span>
              )}
              <HiOutlineSelector className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                {items.map((item) => (
                  <Listbox.Option
                    key={item.value}
                    className={({ active }) =>
                      clsx(
                        active ? "bg-gray-700 text-white" : "",
                        "relative cursor-pointer select-none py-2 pl-3 pr-9"
                      )
                    }
                    value={item.value}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          <span
                            className={clsx(
                              selected ? "font-semibold" : "font-normal",
                              "ml-3 block truncate"
                            )}
                          >
                            {item.label}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={clsx(
                              active ? "text-white" : "text-blue-400",
                              "absolute inset-y-0 right-0 flex items-center pr-4"
                            )}
                          >
                            <AiOutlineCheck
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
