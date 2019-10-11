import { Parallel, Task, fromPromise, isFaulted } from '@recubed/task';
import { Dispatch } from 'redux';
import { Actions } from './actions';
import { HTTP } from './constants';
import { Dependency, Http, _ } from './types';

const normalize = (url: string) => (HTTP.test(url) ? url : `https://${url}`);

const HttpTask = (http: Http) => ({ url, opts }: Dependency<_>) =>
  fromPromise(f => f(http(normalize(url), opts)));

const zip = <a extends any[], b extends any[]>(left: a, right: b) =>
  left.map((x, i) => [x, right[i]]);

export const effects = (http: Http, dispatch: Dispatch) => <
  a extends Dependency<_>[]
>(
  deps: a
) =>
  Task(f => f(dispatch(Actions.$$RECUBED_MARK_STALE(deps)))).chain(() => {
    return Parallel(...deps.map(HttpTask(http))).resume(res =>
      dispatch(
        Actions.$$RECUBED_SAVE_FETCHED(zip(
          deps,
          isFaulted(res) ? res.fault : res
        ) as any)
      )
    );
  });
