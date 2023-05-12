import { getABResetFunction } from "lib/abby";
import { useRouter } from "next/router";

export default function APage() {
  const router = useRouter();
  const onReset = () => {
    const resetCookie = getABResetFunction("SignupButton");
    resetCookie();
    router.reload();
  };
  return (
    <div>
      <h1>A</h1>
      <button onClick={onReset}>Reset Cookie</button>
    </div>
  );
}
