import { Union } from "./types";
import { StrMap } from "@recubed/async";

export const isString = x => typeof x === "string";

export const merge = <a extends object[]>(...xs: a): Union<a> =>
  Object.assign({}, ...xs);

export const pick = <a extends StrMap, bs extends (keyof a)[]>(...keys: bs) => (
  x: a
) =>
  Object.entries(x).reduce(
    (acc, [key, value]) =>
      keys.includes(key) ? { ...acc, [key]: value } : acc,
    {}
  );
