import { AnyAction } from 'redux';
import { UnionOf } from 'unionize';
import { Actions, isUnion } from './actions';
import { Dependency, Resource, Response, _, StrMap } from './types';
import { merge } from './utils';

export const markStale = <a extends object>(state: a) => (
  xs: Dependency<_>[]
) =>
  merge(
    state,
    xs.reduce(
      (acc, { url, ...rest }) => ({
        ...acc,
        [url]: { meta: { ...rest, stale: true } }
      }),
      {}
    )
  );

export const saveFetched = <a extends object, b>(state: a) => (
  xs: Response<b>[]
) =>
  merge(
    state,
    xs.reduce<StrMap<Resource<b>>>(
      (acc, { fault, value: { payload, meta: { url, ttl } } }) => ({
        ...acc,
        [url]: {
          data: payload,
          meta: {
            stale: false,
            timestamp: Date.now(),
            ttl,
            fault
          }
        }
      }),
      {}
    )
  );

export const reducers = (
  state = {},
  action: AnyAction | UnionOf<typeof Actions>
) =>
  isUnion(action)
    ? Actions.match(action, {
        $$RECUBED_MARK_STALE: markStale(state),
        $$RECUBED_SAVE_FETCHED: saveFetched(state)
      })
    : state;
