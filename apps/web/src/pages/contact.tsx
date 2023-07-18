import { useRouter } from "next/router";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useForm } from "react-hook-form";
import { FormEventHandler } from "react";
import { trpc } from "utils/trpc";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
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
      console.log(values);
      const { name, mailadress, surname, message } = values;
      await sendData({ name, mailadress, surname, message });
      toast.success("Send");
    } catch (error) {
      toast.error("Please try again!");
    }
  });

  const inputFieldStyle =
    "border-2 border-width border-solid border-accent-background rounded w-full pl-2 mr-5 py-1 bg-inherit";

  return (
    <>
      <div className="h-screen bg-primary-background text-primary-foreground">
        <Navbar />
        <main className="mx-auto mt-5 flex h-full w-full min-w-min flex-col items-center justify-center  pb-40 sm:mt-5 sm:h-4/5 sm:w-3/6">
          <div className="mb-10 flex w-8/12 flex-col  md:pb-24">
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
            <div className="md:self:start self-center">
              Do you have any questions, comments or suggestions?
              <div className="self-center">Do not hesitate to contact us.</div>
            </div>
          </div>
          <form
            className="justify-centerborder-2 flex w-8/12 flex-col items-center"
            onSubmit={onSubmit}
          >
            <div className="flex w-full  flex-row flex-wrap justify-between">
              <div className="mb-4 flex w-44 flex-col">
                <label className="mb-1">Surname</label>
                <input
                  {...register("surname")}
                  className={inputFieldStyle}
                  placeholder="Surname"
                ></input>
              </div>
              <div className=" mb-4 flex w-44 flex-col space-y-0 place-self-end ">
                <label className="mb-1 ">Name</label>
                <input
                  {...register("name")}
                  className={inputFieldStyle}
                  placeholder="Name"
                ></input>
              </div>
            </div>
            <div className="mb-4 flex w-full flex-col self-start">
              <div className=" mb-4 flex w-44 flex-col">
                <label className="mb-1" htmlFor="mail adress">
                  Mail address
                </label>
                <input
                  {...register("mailadress")}
                  className={inputFieldStyle}
                  placeholder="your@mailadress.com"
                ></input>
              </div>
              <div className="mb-4 flex w-full flex-col">
                <label className="mb-1" htmlFor="your message">
                  Your message
                </label>
                <input
                  type="text"
                  {...register("message")}
                  className="border-width roundedborder-2 h-32 min-h-max w-full border-solid border-accent-background  bg-inherit"
                  placeholder="Your message text here"
                ></input>
              </div>
            </div>
            <input
              className="border-1 mb-2 w-24 rounded-md border-black bg-pink-300 "
              type="submit"
            />
            <span className="text-xs text-pink-300">
              By submitting this form you agree to our{" "}
              <a className="text-white">Terms of use</a> and{" "}
              <a className="text-white">Privacy Policy</a>
            </span>
          </form>
        </main>
        {/* <Footer></Footer> */}
      </div>
    </>
  );
}
