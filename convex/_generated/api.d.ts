import type { ApiFromModules } from "convex/server";
import type * as clicks from "../clicks";
import type * as links from "../links";

declare const fullApi: ApiFromModules<{
  clicks: typeof clicks;
  links: typeof links;
}>;

export declare const api: typeof fullApi["public"];
export declare const internal: typeof fullApi["internal"];
export declare const internalApi: typeof fullApi["internal"];
