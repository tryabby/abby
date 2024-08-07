import { usePlausible as _usePlausible } from "next-plausible";
import type { PlausibleEvents } from "types/plausible-events";

export const useTracking = _usePlausible<PlausibleEvents>;
