import { Continuation, Parallel, StrMap, Task } from "@recubed/async";
import { Dispatch } from "redux";
import { Actions } from "./actions";
import { HTTP, TTL } from "./constants";
import { Config, Dependency, Http, _ } from "./types";

const withProtocol = (url: string) => (HTTP.test(url) ? url : `https://${url}`);

const HttpTask = <a extends StrMap>(http: Http, opts?: a) =>
  Task((url, _ttl) => http(withProtocol(url), opts));

export const define = (
  { http, ttl: ConfigTTL }: Config,
  dispatch: Dispatch
) => <a extends Dependency<_>[]>(deps: a) => {
  const all = Parallel(
    ...deps.map(({ url, opts, ttl }) => () =>
      HttpTask(http, opts)(url, ttl || ConfigTTL || TTL)
    )
  );

  return Continuation(
    Task(() => Promise.resolve(dispatch(Actions.$$RECUBED_MARK_STALE(deps))))
  ).pipe(_ => () =>
    all().then(res => (dispatch(Actions.$$RECUBED_SAVE_FETCHED(res)), res))
  );
};
