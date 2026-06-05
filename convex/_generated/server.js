import {
  actionGeneric,
  httpActionGeneric,
  mutationGeneric,
  queryGeneric,
} from "convex/server";

export const query = queryGeneric;
export const mutation = mutationGeneric;
export const action = actionGeneric;
export const httpAction = httpActionGeneric;
export const internalQuery = queryGeneric;
export const internalMutation = mutationGeneric;
export const internalAction = actionGeneric;
