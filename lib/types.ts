import { PREFIX } from './constants';
import { Options } from '@recubed/task';

export type _ = unknown;

export type Void = () => void;

export type StrMap<a = any> = {
  [key: string]: a;
};

export type Distribute<u> = (u extends any
  ? (union: u) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never;

export type Union<a extends object[]> = a extends (infer b)[]
  ? Distribute<b>
  : object;

export type Http = <a extends object = object>(
  url: string,
  options?: a
) => Promise<_>;

export type Config = {
  http: Http;
  ttl?: number;
};

export type Dependency<a, b extends string = string> = {
  url: b;
  ttl?: number;
  payload?: a;
  opts?: StrMap;
};

export type StrDep<a, b extends string = string> = Dependency<a, b> | b;

export type Deps2Resources<a extends StrDep<_>[]> = Union<
  {
    [k in keyof a]: a[k] extends Dependency<infer b>
      ? Record<a[k]['url'], Resource<b>>
      : a[k] extends string
      ? Record<a[k], Resource<_>>
      : Record<string, _>;
  }
>;

export type Response<a> = Options<a> & {
  value?: {
    payload?: a;
    fault?: any;
    meta: {
      url: string;
      ttl: number;
    };
  };
};

export type Resource<a> = {
  data?: a;
  meta: {
    stale: boolean;
    timestamp: number;
    ttl: number;
    fault?: any;
  };
};

export type State<a> = Record<typeof PREFIX, StrMap<Resource<a>>>;
