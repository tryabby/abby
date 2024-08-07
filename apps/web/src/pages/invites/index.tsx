import type { GetServerSideProps, NextPage } from "next";

export const getServerSideProps: GetServerSideProps = async (_ctx) => {
  return {
    props: {},
    redirect: {
      destination: "/",
    },
  };
};

const Invite: NextPage = () => {
  return null;
};

export default Invite;
