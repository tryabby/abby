import {
  RadioGroup,
  RadioGroupItem as RadixRadioGroupItem,
} from "components/ui/radio-group";

export type RadioGroupItem = {
  label: string;
  value: string;
};

type ArrayLike<T> = Array<T> | ReadonlyArray<T>;

type Props = {
  items: ArrayLike<RadioGroupItem>;
  value: RadioGroupItem["value"];
  onChange: (value: RadioGroupItem["value"]) => void;
  isLoading?: boolean;
  label?: string;
};

export function RadioGroupComponent({ items, onChange, value }: Props) {
  return (
    <RadioGroup
      onValueChange={onChange}
      className="flex space-x-4"
      defaultValue={value}
    >
      {items.map((item) => (
        <div key={item.value} className="flex items-center space-x-2">
          <RadixRadioGroupItem value={item.value} id={item.value} />
          <div>{item.label}</div>
        </div>
      ))}
    </RadioGroup>
  );
}
