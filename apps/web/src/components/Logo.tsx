type Props = {
  as?: React.ElementType;
};

export default function Logo({ as: Component = "span", ...props }: Props) {
  return <Component className="text-3xl font-bold">A/BBY</Component>;
}
