import { getABTestValue, withAbbyApiHandler } from "lib/abby";

export default withAbbyApiHandler(async (req, res) => {
  const [variant, setCookie] = getABTestValue("SignupButton", req);

  setCookie(res);

  res.status(200).json({ variant });
});
