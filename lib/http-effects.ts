import { Parallel, Task, fromPromise, isFaulted } from '@recubed/task';
import { Dispatch } from 'redux';
import { Actions } from './actions';
import { HTTP } from './constants';
import { Dependency, Http, _ } from './types';
import { zip } from './utils';

const normalize = (url: string) => (HTTP.test(url) ? url : `https://${url}`);

const HttpTask = (http: Http) => ({ url, opts }: Dependency<_>) =>
  fromPromise(f => f(http(normalize(url), opts)));

export const effects = (http: Http, dispatch: Dispatch) => <
  a extends Required<Dependency<_>>[]
>(
  deps: a
) =>
  Task(f => f(dispatch(Actions.$$RECUBED_MARK_STALE(deps)))).chain(() => {
    return Parallel(...deps.map(HttpTask(http))).resume(res =>
      dispatch(
        Actions.$$RECUBED_SAVE_FETCHED(
          zip(deps, isFaulted(res) ? res.fault : res)
        )
      )
    );
  });
