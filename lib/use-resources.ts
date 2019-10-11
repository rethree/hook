import { useEffect, useMemo } from 'react';
import { shallowEqual, useSelector, useStore } from 'react-redux';
import { UseOnce, PREFIX, TTL } from './constants';
import { effects } from './http-effects';
import { takeInvalid } from './projections';
import {
  Config,
  Dependency,
  Deps2Resources,
  State,
  DependencyLike,
  _,
  Void
} from './types';
import { isString, pick, merge } from './utils';

const normalize = <a extends DependencyLike<_>>(ttl?: number) => (
  dep: a
): a extends DependencyLike<infer b> ? Dependency<b> : _ =>
  merge({ ttl }, isString(dep) ? { url: dep } : (dep as any));

export const hook = ({ http, ttl }: Config) =>
  function useResources<a extends DependencyLike<_>[]>(
    dependencies: a,
    eq = shallowEqual
  ): [Deps2Resources<a> | {}, Void] {
    const { getState, dispatch } = useStore();
    const [deps, urls, task] = useMemo(() => {
      const deps = dependencies.map(normalize(TTL || ttl));
      return [deps, deps.map(({ url }) => url), effects(http, dispatch)];
    }, [dependencies]);
    const sync = () => {
      const invalid = takeInvalid(deps)(getState);
      return invalid.length < 1 || task(invalid);
    };

    useEffect(() => {
      (async () => {
        await sync();
      })();
    }, UseOnce);

    const slice = useSelector<State<_>, State<_>[typeof PREFIX]>(
      state => pick(...urls)(state[PREFIX]),
      eq
    );

    return [slice, sync];
  };
