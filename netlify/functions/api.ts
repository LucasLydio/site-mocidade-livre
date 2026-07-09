import { handleApi } from "../../backend/src/app";
import type { NetlifyEvent } from "../../backend/src/types/http.types";

export const handler = async (event: NetlifyEvent) => {
  return handleApi(event);
};

