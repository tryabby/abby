import { type NextPage } from "next";
import { useRouter } from "next/router";
import { checkout } from "pages/api/checkout";

import { trpc } from "utils/trpc";

const Projects: NextPage = () => {
  const router = useRouter()
  const { projectId } = router.query;

  return (
    <>
      <button onClick={(() => {
        checkout({
          lineItems: [
            {
              price: "price_1MCMSULANJ3E1Ww3bNfa8hQj",
              quantity: 1
            }
          ]
        })
      })}>BUY!</button>
    </>
  );
};

export default Projects;
