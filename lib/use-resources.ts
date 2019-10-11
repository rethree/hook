import { useMemo } from 'react';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import { PREFIX, TTL, UseOnce } from './constants';
import { effects } from './http-effects';
import { takeInvalid } from './projections';
import {
  Config,
  Dependency,
  DependencyLike,
  Deps2Resources,
  State,
  Void,
  _
} from './types';
import { isString, merge, pick } from './utils';
import useAsyncEffect from 'use-async-effect';
import { Store } from 'redux';
import { TaskDef } from '@recubed/task';

const normalize = <a extends DependencyLike<_>>(ttl?: number) => (
  dep: a
): a extends DependencyLike<infer b> ? Dependency<b> : _ =>
  merge({ ttl }, isString(dep) ? { url: dep } : (dep as any));

const maybeTasks = (
  getState: () => Store,
  deps: Dependency<_>[],
  tasks: (deps: Dependency<_>[]) => TaskDef<void>
) => () => {
  const invalid = takeInvalid(deps)(getState);
  return invalid.length < 1 || tasks(invalid);
};

export const hook = ({ http, ttl }: Config) =>
  function useResources<a extends DependencyLike<_>[]>(
    dependencies: a,
    eq = shallowEqual
  ): [Deps2Resources<a> | {}, Void] {
    const { getState, dispatch } = useStore();
    const [deps, urls, tasks] = useMemo(() => {
      const deps = dependencies.map(normalize(TTL || ttl));
      return [deps, deps.map(({ url }) => url), effects(http, dispatch)];
    }, [dependencies]);
    const sync = maybeTasks(getState, deps, tasks);

    useAsyncEffect(() => sync(), UseOnce);

    const slice = useSelector<State<_>, State<_>[typeof PREFIX]>(
      state => pick(...urls)(state[PREFIX]),
      eq
    );

    return [slice, sync];
  };
