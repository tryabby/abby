import clsx from "clsx";
import Logo from "components/Logo";
import { signIn } from "next-auth/react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { FaGithub } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";

const DEFAULT_CALLBACK_URL = "/projects";

const baseSocialButtonStyles =
  "flex items-center rounded-md px-6 py-3 text-lg text-white transition-colors duration-200 ease-in-out";

export default function LoginPage() {
  const router = useRouter();

  const callbackUrl =
    typeof router.query.callbackUrl === "string"
      ? router.query.callbackUrl
      : DEFAULT_CALLBACK_URL;

  const { register, handleSubmit, formState } = useForm<{ email: string }>();
  return (
    <main className="flex min-h-screen items-center justify-center bg-primary-background text-primary-foreground">
      <NextSeo description="test123" title="login" />
      <div className="max-w-2xl rounded-md bg-white p-8 text-gray-900 shadow-2xl">
        <Link href="/" className="mb-12 block text-center">
          <Logo as="h1" />
        </Link>
        <div className="flex flex-col">
          <button
            className={clsx(
              baseSocialButtonStyles,
              "bg-[#323a4d] text-white hover:bg-[#4b5672]"
            )}
            onClick={() =>
              signIn("github", {
                callbackUrl,
              })
            }
          >
            <FaGithub className="mr-2" size={24} />
            Login with GitHub
          </button>
          <p className="my-6 text-center">or</p>
          <form
            onSubmit={handleSubmit(({ email }) => {
              signIn("email", {
                email,
                callbackUrl,
              });
            })}
          >
            <input
              {...register("email", {
                required: "Please enter an email",
              })}
              className={clsx(
                "mb-3 w-full rounded-md border px-6 py-3 outline-none",
                formState.errors.email ? "border-red-500" : "border-gray-400"
              )}
              placeholder="Email Address"
              type="email"
              autoComplete="email"
            />
            {formState.errors.email && (
              <p className="mb-3 text-center text-xs text-red-500">
                {formState.errors.email.message}
              </p>
            )}
            <button
              type="submit"
              className={clsx(
                baseSocialButtonStyles,
                "bg-gray-200 text-gray-900 hover:bg-gray-300"
              )}
            >
              <MdOutlineEmail className="mr-2" size={24} />
              Continue with Email
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
