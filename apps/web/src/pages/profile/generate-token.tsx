import { useQuery } from "@tanstack/react-query";
import { Layout } from "components/Layout";
import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import { createContext } from "server/trpc/context";
import { appRouter } from "server/trpc/router/_app";
import { NextPageWithLayout } from "./_app";

const GenerateTokenPage: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ token, callbackUrl }) => {
  const { isLoading, isError } = useQuery(["generate-token"], () => {
    const url = new URL(callbackUrl as string);
    url.searchParams.set("token", token);
    return fetch(url);
  });
  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1>Something went wrong!</h1>;

  return <h1>You can safely close this tab now!</h1>;
};

GenerateTokenPage.getLayout = (page) => <Layout hideSidebar>{page}</Layout>;

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
