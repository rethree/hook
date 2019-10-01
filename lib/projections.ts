import { compose } from "redux";
import { PREFIX } from "./constants";
import { Dependency, Resource, State, _ } from "./types";

export const isOutdated = <a>({ meta: { timestamp, ttl } }: Resource<a>) =>
  timestamp + Date.now() >= ttl;

export const takeSlice = <a, b extends State<a>>(getState: () => b) =>
  getState()[PREFIX];

export const skipValid = <a extends Dependency<_>[]>(deps: a) => (
  slice: State<_>[typeof PREFIX]
) => deps.filter(({ url }) => !(url in slice) || isOutdated(slice[url]));

export const takeInvalid = <a extends Dependency<_>[]>(deps: a) =>
  compose(
    skipValid(deps),
    takeSlice
  );
