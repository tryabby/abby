import { Metadata } from "next";
import Link from "next/link";

import { cn } from "lib/utils";
import { buttonVariants } from "components/ui/button";
import { UserAuthForm } from "components/UserAuthForm";
import { useRouter } from "next/router";
import Logo from "components/Logo";

const DEFAULT_CALLBACK_URL = "/projects";

export default function AuthenticationPage() {
  return (
    <>
      <div className="container relative flex h-screen flex-col items-center justify-center bg-background md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8"
          )}
        >
          Login
        </Link>
        <div className="relative hidden h-full flex-col bg-accent p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-accent" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Logo />
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Feature Flagging & Remote Config for the rest of
                us.&rdquo;
              </p>
              {/* <footer className="text-sm">Sofia Davis</footer> */}
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="mb-6 flex justify-center md:hidden">
              <Logo />
            </div>
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to create your account
              </p>
            </div>
            <UserAuthForm callbackUrl={DEFAULT_CALLBACK_URL} customButtonText="Sign Up with Email"/>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
