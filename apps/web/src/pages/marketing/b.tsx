import { getABResetFunction } from "lib/abby";
import { useRouter } from "next/router";

export default function BPage() {
  const router = useRouter();
  const onReset = () => {
    const resetCookie = getABResetFunction("SignupButton");
    resetCookie()
    router.reload();
  };
  return (
    <div>
      <h1>B</h1>
      <button onClick={onReset}>Reset Cookie</button>
    </div>
  );
}
