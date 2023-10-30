import { useQuery } from "@tanstack/react-query";
import { Layout } from "components/Layout";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { createContext } from "server/trpc/context";
import { appRouter } from "server/trpc/router/_app";
import { NextPageWithLayout } from "../_app";
import Logo from "components/Logo";
import { match } from "ts-pattern";

const GenerateTokenPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ token, callbackUrl }) => {
  const { status } = useQuery(["generate-token"], () => {
    const url = new URL(callbackUrl as string);
    url.searchParams.set("token", token);
    return fetch(url);
  });

  return (
    <main className="absolute left-1/2 top-1/2 h-[400px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 p-8 text-center">
      <div className="flex h-full w-full flex-col items-center justify-between py-16">
        <Logo />
        <div>
          {match(status)
            .with("loading", () => <h1>Loading...</h1>)
            .with("error", () => <h1>Something went wrong!</h1>)
            .with("success", () => <h1>You can safely close this tab now!</h1>)
            .exhaustive()}
        </div>
      </div>
    </main>
  );
};

GenerateTokenPage.getLayout = (page) => <Layout>{page}</Layout>;

export const getServerSideProps = (async (ctx) => {
  const trpc = appRouter.createCaller(await createContext(ctx as any));

  const token = await trpc.apikey.createApiKey({
    name: "CLI Token",
  });

  if (typeof ctx.query.callbackUrl != "string") {
    throw new Error("Missing callbackUrl");
  }

  return {
    props: {
      token,
      callbackUrl: ctx.query.callbackUrl,
    },
  };
}) satisfies GetServerSideProps;

export default GenerateTokenPage;
