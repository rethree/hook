import { useEffect, useMemo } from "react";
import { shallowEqual, useSelector, useStore } from "react-redux";
import { UseOnce, PREFIX } from "./constants";
import { define } from "./effects";
import { takeInvalid } from "./projections";
import {
  Config,
  Dependency,
  Deps2Resources,
  State,
  StrDep,
  _,
  Void
} from "./types";
import { isString, pick } from "./utils";

const normalize = <a extends StrDep<_>>(
  dep: a
): a extends StrDep<infer b> ? Dependency<b> : _ =>
  isString(dep) ? { url: dep } : (dep as any);

export const hook = (cfg: Config) =>
  function useResources<a extends StrDep<_>[]>(
    dependencies: a,
    eq = shallowEqual
  ): [Deps2Resources<a> | {}, Void] {
    const { getState, dispatch } = useStore<State<_>>();
    const [deps, urls, task] = useMemo(() => {
      const deps = dependencies.map(normalize);
      return [deps, deps.map(({ url }) => url), define(cfg, dispatch)];
    }, [dependencies]);
    const fetch = async () => {
      const invalid = takeInvalid(deps)(getState);
      return invalid.length < 1 || task(invalid);
    };

    useEffect(() => void fetch(), UseOnce);

    const slice = useSelector<State<_>, State<_>[typeof PREFIX]>(
      state => pick(...urls)(state[PREFIX]),
      eq
    );

    return [slice, fetch];
  };
