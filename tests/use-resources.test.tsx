import { FunctionComponent } from 'react';
import { combineReducers, createStore, Store } from 'redux';
import { Recubed } from '../lib';
import { PREFIX, TTL } from '../lib/constants';
import { Dependency, _, StrMap, Resource, State } from '../lib/types';
import { Effectful, mountEffectful } from './_utils';
import { Observable } from 'rxjs/internal/Observable';
import { skip, map } from 'rxjs/operators';
import { partition } from 'rxjs';

const { hook: useResources, reducer } = Recubed({
  http: <a extends object>(url: string, _opts?: a) => {
    switch (url.split('//')[1]) {
      case 'success0':
      case 'success1':
      case 'cached':
        return Promise.resolve(42);
      default:
      case 'failure':
        return Promise.reject(9001);
    }
  }
});

const partitions = (stream: Observable<[StrMap<Resource<_>>, Function]>) => {
  const [stale, fresh] = partition(
    stream.pipe(
      skip(1),
      map(([x]) => x)
    ),
    x => Object.values(x).every(y => y.meta.stale)
  );

  return [stale, fresh];
};

describe('useResources', () => {
  describe('happy path', () => {
    const HappPath: FunctionComponent<{
      observer: (value: _) => void;
    }> = ({ observer }) =>
      Effectful(
        () =>
          useResources<
            [
              Dependency<{ data: 42 }, 'success0'>,
              Dependency<{ data: 42 }, 'success1'>
            ]
          >([
            {
              url: 'success0'
            },
            {
              url: 'success1'
            }
          ]),
        observer
      );
    const store: Store<State<_>> = createStore(combineReducers(reducer));
    const stream = mountEffectful(HappPath, store);
    const [stale, fresh] = partitions(stream);

    test('before data is fetched, store entries are set to stale', done => {
      stale.subscribe(() => done(), done.fail);
    });

    test('once data is fetched store entries are updated', done => {
      fresh.subscribe(x => {
        expect(x.success0.data).toBe(42);
        expect(x.success1.data).toBe(42);
        done();
      }, done.fail);
    });

    test('ordered delivery', done => {
      stream.pipe(skip(2)).subscribe(() => {
        const slice = store.getState()[PREFIX];
        expect(slice.success0.meta.stale).toBe(false);
        expect(slice.success1.meta.stale).toBe(false);
        done();
      }, done.fail);
    });
  });

  describe('with faults', () => {
    const WithFaults: FunctionComponent<{
      observer: (value: _) => void;
    }> = ({ observer }) =>
      Effectful(
        () =>
          useResources<
            [
              Dependency<{ data: 42 }, 'success0'>,
              Dependency<{ data: 42 }, 'failure'>
            ]
          >([
            {
              url: 'success0'
            },
            {
              url: 'failure'
            }
          ]),
        observer
      );
    const store: Store<State<_>> = createStore(combineReducers(reducer));
    const stream = mountEffectful(WithFaults, store);
    const [stale, fresh] = partitions(stream);

    test('before data is fetched, store entries are set to stale', done => {
      stale.subscribe(() => done(), done.fail);
    });

    test('once data is fetched store entries are updated', done => {
      fresh.subscribe(x => {
        expect(x.success0.data).toBe(42);
        expect(x.failure.meta.fault).toBe(9001);
        done();
      }, done.fail);
    });

    test('ordered delivery', done => {
      stream.pipe(skip(2)).subscribe(() => {
        const slice = store.getState()[PREFIX];
        expect(slice.success0.meta.stale).toBe(false);
        expect(slice.failure.meta.stale).toBe(false);
        done();
      }, done.fail);
    });
  });

  describe('cache', () => {
    const createsStore = () =>
      createStore(combineReducers(reducer), {
        [PREFIX]: {
          cached: {
            data: 42,
            meta: {
              stale: false,
              ttl: Number.MAX_SAFE_INTEGER,
              timestamp: 0
            }
          },
          success1: {
            data: 42,
            meta: {
              stale: false,
              ttl: 0,
              timestamp: 1
            }
          }
        }
      });

    test('cached resources are ignored', () => {
      const store = createsStore();
      const spy = jest.spyOn(store, 'dispatch');

      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        Effectful(
          () =>
            useResources<[Dependency<{ data: 42 }, 'cached'>]>([
              {
                url: 'cached'
              }
            ]),
          observer
        );

      mountEffectful(ShouldUseCache, store);

      expect(spy).not.toHaveBeenCalled();
    });

    test('missing resources are fetched', done => {
      const store = createsStore();
      const spy = jest.spyOn(store, 'dispatch');

      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        Effectful(
          () =>
            useResources<
              [
                Dependency<{ data: 42 }, 'cached'>,
                Dependency<{ data: 42 }, 'success0'>
              ]
            >([
              {
                url: 'cached'
              },
              {
                url: 'success0'
              }
            ]),
          observer
        );

      const stream = mountEffectful(ShouldUseCache, store);

      stream.pipe(skip(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          payload: [{ url: 'success0', ttl: TTL }],
          type: '$$RECUBED_MARK_STALE'
        });
        done();
      }, done.fail);
    });

    test('outdated resources are refetched', done => {
      const store = createsStore();
      const spy = jest.spyOn(store, 'dispatch');

      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        Effectful(
          () =>
            useResources<
              [
                Dependency<{ data: 42 }, 'cached'>,
                Dependency<{ data: 42 }, 'success0'>,
                Dependency<{ data: 42 }, 'success1'>
              ]
            >([
              {
                url: 'cached'
              },
              {
                url: 'success0'
              },
              {
                url: 'success1'
              }
            ]),
          observer
        );

      const stream = mountEffectful(ShouldUseCache, store);

      stream.pipe(skip(2)).subscribe(() => {
        const [ stale ] = spy.mock.calls;
        expect(stale).toMatchObject([{
          payload: [
            { url: 'success0', ttl: TTL }, { url: 'success1', ttl: TTL }
          ],
          type: '$$RECUBED_MARK_STALE'
        }]);
        done();
      }, done.fail);
    });

    test('string dependencies are allowed', done => {
      const store = createsStore();
      const spy = jest.spyOn(store, 'dispatch');

      const StringDeps: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        Effectful(() => useResources<['success0']>(['success0']), observer);

      const stream = mountEffectful(StringDeps, store);

      stream.pipe(skip(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          payload: [{ url: 'success0', ttl: TTL }],
          type: '$$RECUBED_MARK_STALE'
        });
        done();
      }, done.fail);
    });

    test('mixed dependencies are allowed', done => {
      const store = createsStore();
      const spy = jest.spyOn(store, 'dispatch');

      const StringDeps: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        Effectful(
          () =>
            useResources<['success0', Dependency<'success1'>]>([
              'success0',
              { url: 'success1' }
            ]),
          observer
        );

      const stream = mountEffectful(StringDeps, store);

      stream.pipe(skip(1)).subscribe(() => {
        expect(spy).toHaveBeenCalledWith({
          payload: [
            { url: 'success0', ttl: TTL },
            { url: 'success1', ttl: TTL }
          ],
          type: '$$RECUBED_MARK_STALE'
        });
        done();
      }, done.fail);
    });
  });
});
