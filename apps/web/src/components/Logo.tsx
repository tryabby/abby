type Props = {
  as?: React.ElementType;
};

export default function Logo({ as: Component = "span" }: Props) {
  return (
    <Component className="font-logo text-3xl font-semibold">Abby</Component>
  );
}
