import { Dispatch } from "redux";
import { Actions } from "./actions";
import { HTTP, TTL } from "./constants";
import { Config, Dependency, Http, _ } from "./types";
import { Task, Parallel, complete } from "@recubed/task";

const normalize = (url: string) => (HTTP.test(url) ? url : `https://${url}`);

const HttpTask = (http: Http, configTtl?: number) => ({
  url,
  opts,
  ttl
}: Dependency<_>) =>
  Task(async f => {
    const res = await http(normalize(url), opts);
    f({ payload: res, meta: { url, ttl: ttl || configTtl || TTL } });
  });

export const define = ({ http, ttl }: Config, dispatch: Dispatch) => <
  a extends Dependency<_>[]
>(
  deps: a
) => {
  const asHttpTask = HttpTask(http, ttl);

  return complete(dispatch(Actions.$$RECUBED_MARK_STALE(deps))).chain(() =>
    Parallel(...deps.map(asHttpTask)).map(res =>
      dispatch(Actions.$$RECUBED_SAVE_FETCHED(res))
    )
  );
};
