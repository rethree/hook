import { StrMap } from "@recubed/async";
import { mount, ReactWrapper } from "enzyme";
import { ComponentType, FunctionComponent } from "react";
import { act } from "react-dom/test-utils";
import { combineReducers, createStore, Store } from "redux";
import { Observable, partition } from "rxjs";
import { map, skip, windowCount } from "rxjs/operators";
import { Recubed } from "../lib";
import { PREFIX } from "../lib/constants";
import { Dependency, Resource, State, _ } from "../lib/types";
import { WillEmit, WithStore } from "./_utils";

const { hook: useResources, reducer } = Recubed({
  http: <a extends object>(url: string, _opts?: a) => {
    switch (url.split("//")[1]) {
      case "success0":
      case "success1":
      case "cached":
        return Promise.resolve(42);
      default:
      case "failure":
        return Promise.reject(9001);
    }
  }
});

const init = <a,>(
  Component: ComponentType<a>,
  store: Store
): Observable<[StrMap<Resource<_>>, Function]> => {
  let wrapper: ReactWrapper;

  act(() => {
    wrapper = mount(WithStore(Component, { store }));
  });

  const stream: Observable<[StrMap<Resource<_>>, Function]> = wrapper!
    .find("main")
    .prop("data-stream");

  return wrapper!.update(), stream;
};

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

describe("useResources", () => {
  describe("happy path", () => {
    const HappPath: FunctionComponent<{
      observer: (value: _) => void;
    }> = ({ observer }) =>
      WillEmit(
        () =>
          useResources<
            [
              Dependency<{ data: 42 }, "success0">,
              Dependency<{ data: 42 }, "success1">
            ]
          >([
            {
              url: "success0"
            },
            {
              url: "success1"
            }
          ]),
        observer
      );
    const store: Store<State<_>> = createStore(combineReducers(reducer));
    const stream = init(HappPath, store);
    const [stale, fresh] = partitions(stream);

    test("before data is fetched, store entries are set to stale", done => {
      stale.pipe(windowCount(1)).subscribe(() => done(), done.fail);
    });

    test("once data is fetched store entries are updated", done => {
      fresh.subscribe(x => {
        expect(x.success0.data).toBe(42);
        expect(x.success1.data).toBe(42);
        done();
      }, done.fail);
    });

    test("ordered delivery", done => {
      stream.pipe(windowCount(3)).subscribe(() => {
        const slice = store.getState()[PREFIX];
        expect(slice.success0.meta.stale).toBe(false);
        expect(slice.success1.meta.stale).toBe(false);
        done();
      }, done.fail);
    });
  });

  describe("with faults", () => {
    const WithFaults: FunctionComponent<{
      observer: (value: _) => void;
    }> = ({ observer }) =>
      WillEmit(
        () =>
          useResources<
            [
              Dependency<{ data: 42 }, "success0">,
              Dependency<{ data: 42 }, "failure">
            ]
          >([
            {
              url: "success0"
            },
            {
              url: "failure"
            }
          ]),
        observer
      );
    const store: Store<State<_>> = createStore(combineReducers(reducer));
    const stream = init(WithFaults, store);
    const [stale, fresh] = partitions(stream);

    test("before data is fetched, store entries are set to stale", done => {
      stale.pipe(windowCount(1)).subscribe(() => done(), done.fail);
    });

    test("once data is fetched store entries are updated", done => {
      fresh.subscribe(x => {
        expect(x.success0.data).toBe(42);
        expect(x.failure.meta.fault).toBe(9001);
        done();
      }, done.fail);
    });

    test("ordered delivery", done => {
      stream.pipe(windowCount(3)).subscribe(() => {
        const slice = store.getState()[PREFIX];
        expect(slice.success0.meta.stale).toBe(false);
        expect(slice.failure.meta.stale).toBe(false);
        done();
      }, done.fail);
    });
  });

  describe("cache", () => {
    const store = createStore(combineReducers(reducer), {
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

    const spy = jest.spyOn(store, "dispatch");

    test("cached resources are ignored", () => {
      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        WillEmit(
          () =>
            useResources<[Dependency<{ data: 42 }, "cached">]>([
              {
                url: "cached"
              }
            ]),
          observer
        );

      init(ShouldUseCache, store);

      expect(spy).not.toHaveBeenCalled();
      spy.mockClear();
    });

    test("missing resources are fetched", () => {
      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        WillEmit(
          () =>
            useResources<
              [
                Dependency<{ data: 42 }, "cached">,
                Dependency<{ data: 42 }, "success0">
              ]
            >([
              {
                url: "cached"
              },
              {
                url: "success0"
              }
            ]),
          observer
        );

      init(ShouldUseCache, store);

      expect(spy).toHaveBeenCalledWith({
        payload: [{ url: "success0" }],
        type: "$$RECUBED_MARK_STALE"
      });
      spy.mockClear();
    });

    test("outdated resources are refetched", () => {
      const ShouldUseCache: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        WillEmit(
          () =>
            useResources<
              [
                Dependency<{ data: 42 }, "cached">,
                Dependency<{ data: 42 }, "success0">,
                Dependency<{ data: 42 }, "success1">
              ]
            >([
              {
                url: "cached"
              },
              {
                url: "success0"
              },
              {
                url: "success1"
              }
            ]),
          observer
        );

      init(ShouldUseCache, store);

      expect(spy).toHaveBeenCalledWith({
        payload: [{ url: "success0" }, { url: "success1" }],
        type: "$$RECUBED_MARK_STALE"
      });
      spy.mockClear();
    });

    test("string dependencies are allowed", () => {
      const StringDeps: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        WillEmit(() => useResources<["success0"]>(["success0"]), observer);

      init(StringDeps, store);

      expect(spy).toHaveBeenCalledWith({
        payload: [{ url: "success0" }],
        type: "$$RECUBED_MARK_STALE"
      });
      spy.mockClear();
    });

    test("mixed dependencies are allowed", () => {
      const StringDeps: FunctionComponent<{
        observer: (value: _) => void;
      }> = ({ observer }) =>
        WillEmit(
          () =>
            useResources<["success0", Dependency<"success1">]>([
              "success0",
              { url: "success1" }
            ]),
          observer
        );

      init(StringDeps, store);

      expect(spy).toHaveBeenCalledWith({
        payload: [{ url: "success0" }, { url: "success1" }],
        type: "$$RECUBED_MARK_STALE"
      });
      spy.mockClear();
    });
  });
});
