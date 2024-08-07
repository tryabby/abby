import type { NextPage } from "next";
import { checkout } from "pages/api/checkout";

const Projects: NextPage = () => {
  return (
    <>
      <button
        type="button"
        onClick={() => {
          checkout({
            lineItems: [
              {
                price: "price_1MCMSULANJ3E1Ww3bNfa8hQj",
                quantity: 1,
              },
            ],
          });
        }}
      >
        BUY!
      </button>
    </>
  );
};

export default Projects;
