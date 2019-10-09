export type _ = unknown;
export type Nil = undefined;

export const Task$ = Symbol('Task');

export type StrMap<a = any> = {
  readonly [key: string]: a;
};

export type Func<a, b> = (x: a) => b;

export type Meta = {
  readonly meta: StrMap;
};

export type Failure = { fault: any; meta?: StrMap };

export type Completion<a> = { value: a; meta?: StrMap };

export type Options<a> =
  | Failure & { tag: 'Faulted' }
  | Completion<a> & { tag: 'Completed' };

export type ContinuationDef<a> = {
  map: <b>(ab: Func<a, b>) => ContinuationDef<b>;
  chain: <b>(ab: Func<a, TaskDef<b>>) => ContinuationDef<b>;
  then: <b>(done: Func<Options<a>, b>) => void;
};

export type TaskDef<a> = ContinuationDef<a> & {
  [Task$]: true;
};

export type Xf = Func<_, _ | TaskDef<_>>;
