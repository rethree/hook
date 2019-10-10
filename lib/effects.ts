import { Dispatch } from 'redux';
import { Actions } from './actions';
import { HTTP, TTL } from './constants';
import { Config, Dependency, Http, _ } from './types';
import { Task, Parallel, complete } from '@recubed/task';
import zip from 'lodash.zip';

const normalize = (url: string) => (HTTP.test(url) ? url : `https://${url}`);

const HttpTask = (http: Http) => ({ url, opts }: Dependency<_>) =>
  Task(async f => f(await http(normalize(url), opts)));

export const define = (http: Http, dispatch: Dispatch) => <
  a extends Dependency<_>[]
>(
  deps: a
) => {
  const httpTask = HttpTask(http);

  return complete(dispatch(Actions.$$RECUBED_MARK_STALE(deps))).chain(() =>
    Parallel(...deps.map(httpTask)).map(res =>
      dispatch(Actions.$$RECUBED_SAVE_FETCHED(zip(res, deps)))
    )
  );
};
