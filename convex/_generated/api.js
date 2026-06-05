import { makeFunctionReference } from "convex/server";

const createProxy = (path = "") => {
  let targetObj;
  try {
    // Attempt to make a native Convex function reference if path contains a function name
    targetObj = makeFunctionReference(path);
  } catch (e) {
    // Fall back to plain object for intermediate namespace paths
    targetObj = {
      _toApiString: path,
      toString: () => path,
      name: path
    };
  }

  return new Proxy(targetObj, {
    get(target, prop) {
      if (typeof prop === "string") {
        if (prop === "_toApiString") {
          return path;
        }
        if (prop === "name") {
          return path;
        }
        if (prop === "toString") {
          return () => path;
        }
        // Convex UDF format uses colon for function name separation (e.g. links:create)
        const nextPath = path ? `${path}:${prop}` : prop;
        return createProxy(nextPath);
      }
      return target[prop];
    }
  });
};

export const api = createProxy();
export const internal = createProxy();
export const internalApi = createProxy();
export default api;
