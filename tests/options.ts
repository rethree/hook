import { ofType, unionize } from 'unionize';
import { Completion, Failure, Options, _ } from './types';

export const Option = <a>() =>
  unionize({
    Faulted: ofType<Failure>(),
    Completed: ofType<Completion<a>>()
  });

export const O = Option();

export const isFaulted = <a>(
  x: Options<a>
): x is { tag: 'Faulted' } & Failure => Option().is.Faulted(x);

export const isOption = <a>(x: any): x is Options<a> =>
  (typeof x === 'object' && 'tag' in x && x.tag === 'Faulted') ||
  x.tag === 'Completed';

export const allCompleted = <a>(
  x: Options<a>[]
): x is ({ tag: 'Completed' } & Completion<a>)[] => !x.some(isFaulted);
