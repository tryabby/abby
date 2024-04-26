import { GetServerSideProps, type NextPage } from "next"

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return {
    props: {},
    redirect: {
      destination: "/",
    },
  }
}

const Invite: NextPage = () => {
  return null
}

export default Invite
