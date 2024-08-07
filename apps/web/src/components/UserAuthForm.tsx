"use client";

import type * as React from "react";

import { cn } from "lib/utils";

import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { FaGithub, FaGoogle } from "react-icons/fa";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
  customButtonText?: string;
}

export function UserAuthForm({
  className,
  callbackUrl,
  customButtonText,
  ...props
}: UserAuthFormProps) {
  const { register, handleSubmit, formState } = useForm<{ email: string }>();

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form
        onSubmit={handleSubmit(({ email }) => {
          signIn("email", {
            email,
            callbackUrl,
          });
        })}
      >
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              {...register("email", {
                required: "Please enter an email",
              })}
            />
            {formState.errors.email && (
              <p className="mb-3 text-center text-xs text-red-500">
                {formState.errors.email.message}
              </p>
            )}
          </div>
          <Button>{customButtonText ?? "Sign In with Email"}</Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            signIn("google", {
              callbackUrl,
            });
          }}
        >
          <FaGoogle className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            signIn("github", {
              callbackUrl,
            });
          }}
        >
          <FaGithub className="mr-2 h-4 w-4" />
          Github
        </Button>
      </div>
    </div>
  );
}
