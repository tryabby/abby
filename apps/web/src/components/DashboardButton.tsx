import { ComponentPropsWithRef } from "react";
import { Button } from "./ui/button";

type Props = ComponentPropsWithRef<"button">;

export function DashboardButton({ className, ...props }: Props) {
  return <Button {...props} />;
}
