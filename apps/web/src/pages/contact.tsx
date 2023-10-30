import { MarketingLayout } from "../components/MarketingLayout";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import { trpc } from "utils/trpc";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const { register, handleSubmit, formState } = useForm<{
    mailadress: string;
    message: string;
    name: string;
    surname: string;
  }>();

  const sendDataMutation = trpc.misc.contactPageEmail.useMutation();
  const sendData = async (values: {
    mailadress: string;
    message: string;
    name: string;
    surname: string;
  }) => {
    await sendDataMutation.mutateAsync(values);
  };
  const onSubmit = handleSubmit(async (values) => {
    try {
      const { name, mailadress, surname, message } = values;
      await sendData({ name, mailadress, surname, message });
      toast.success("Send!");
    } catch (error) {
      toast.error("Please try again!");
    }
  });
  const inputFieldStyle =
    "text border-2 border-width border-solid rounded w-full pl-2 mr-5 py-1 bg-inherit text-sm";

  return (
    <>
      <MarketingLayout>
        <main className=" mx-auto flex h-full w-full min-w-min flex-col items-center justify-center bg-ab_primary-background pb-20 text-ab_primary-foreground sm:mt-5 sm:h-4/5">
          <div className="mb-10  flex w-full flex-col  md:my-auto md:w-8/12">
            <div className="mx-auto mb-10 flex self-center">
              <h2 className="mark self-center font-bold sm:text-xl md:text-4xl ">
                Contact us
              </h2>
              <svg
                className="h-14 w-16 sm:h-32 sm:w-32"
                viewBox="0 0 120 90"
                fill="none"
              >
                <path
                  d="M59.2441 60.5857L59.6913 60.8093L60.1385 60.5857L118.383 31.4637V88.5369H1V31.4637L59.2441 60.5857ZM59.6913 43.6504L1 14.3048V1H118.383V14.3048L59.6913 43.6504Z"
                  stroke="#F9A8D4"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <div className="mx-auto max-w-xs text-center">
              Do you have any questions, comments or suggestions?
              <div>Do not hesitate to contact us.</div>
            </div>
          </div>
          <form
            className="mx-auto flex w-full max-w-sm flex-col flex-wrap items-start md:w-8/12"
            onSubmit={onSubmit}
          >
            <div className="mb-4 flex w-full flex-grow flex-col ">
              <label className="mb-1 ">Name</label>
              <input
                {...register("name", {
                  required: "Please enter your name",
                })}
                className={clsx(
                  inputFieldStyle,
                  formState.errors.name
                    ? "border-red-500"
                    : "border-ab_accent-background"
                )}
                placeholder="Name"
              ></input>
              {formState.errors.name && (
                <p className="mb-3 text-center text-xs text-red-500">
                  {formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="mb-4 flex w-full flex-grow flex-col">
              <label className="mb-1">Surname</label>
              <input
                {...register("surname", {
                  required: "Please enter your Surname",
                })}
                className={clsx(
                  inputFieldStyle,
                  formState.errors.surname
                    ? "border-red-500"
                    : "border-ab_accent-background"
                )}
                placeholder="Surname"
              ></input>
              {formState.errors.surname && (
                <p className="mb-3 text-center text-xs text-red-500">
                  {formState.errors.surname.message}
                </p>
              )}
            </div>
            <div className=" mb-4 flex w-full flex-grow flex-col">
              <label className="mb-1" htmlFor="mail adress">
                Mail address
              </label>
              <input
                {...register("mailadress", {
                  required: "Please enter an email",
                })}
                className={clsx(
                  inputFieldStyle,
                  formState.errors.mailadress
                    ? "border-red-500"
                    : "border-ab_accent-background"
                )}
                autoComplete="email"
                placeholder="your@mailadress.com"
              ></input>
              {formState.errors.mailadress && (
                <p className="mb-3 text-center text-xs text-red-500">
                  {formState.errors.mailadress.message}
                </p>
              )}
            </div>
            <div className="mb-4 flex w-full flex-grow flex-col">
              <label className="1" htmlFor="your message">
                Your message
              </label>
              <textarea
                {...register("message", {
                  required: "Please enter a message",
                })}
                className={clsx(
                  "h-32 min-h-max w-full rounded border-2 border-solid border-ab_accent-background bg-inherit",
                  formState.errors.message
                    ? "border-red-500"
                    : "border-ab_accent-background"
                )}
                placeholder="Your message text here"
              ></textarea>
              {formState.errors.message && (
                <p className="mb-3 text-center text-xs text-red-500">
                  {formState.errors.message.message}
                </p>
              )}
            </div>
            <button
              className="border-1 mb-4 mt-5 w-24 self-center rounded-md border-ab_accent-foreground bg-ab_accent-background text-ab_accent-foreground"
              type="submit"
            >
              Submit
            </button>
          </form>
          <span className="max-auto inline max-w-sm text-xs text-ab_primary-foreground">
            By submitting this form you agree to our{" "}
            <a className="text-pink-300">Terms of use</a> and{" "}
            <a className="text-pink-300">Privacy Policy</a>
          </span>
        </main>
      </MarketingLayout>
    </>
  );
}
