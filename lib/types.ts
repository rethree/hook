import { Completion, Failure } from '@recubed/task';
import { PREFIX } from './constants';

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
  ttl: number;
  opts?: StrMap;
  _type?: a;
};

export type DependencyLike<a, b extends string = string> = Dependency<a, b> | b;

export type ResourcesFromDeps<a extends DependencyLike<_>[]> = Union<
  {
    [k in keyof a]: a[k] extends Dependency<infer b>
      ? Record<a[k]['url'], Resource<b>>
      : a[k] extends string
      ? Record<a[k], Resource<_>>
      : Record<string, _>;
  }
>;

export type Response<a> = Partial<Failure & Completion<a>>;

export type ResourceSource<a> = [Dependency<a>, Response<a>];

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
