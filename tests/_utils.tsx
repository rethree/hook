import { mount, ReactWrapper } from 'enzyme';
import React, { ComponentType, ReactElement, useEffect, useMemo } from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { Observable, ReplaySubject } from 'rxjs';
import { Resource, StrMap, _ } from '../lib/types';

export const WithStore = <p extends object>(
  Component: ComponentType<typeof props>,
  { store, ...props }: p & { store: Store }
) => (
  <Provider store={store}>
    <Component {...props} />
  </Provider>
);

export const Effectful = <a,>(
  useHook: () => a,
  observer?: (value: ReturnType<typeof useHook>) => void
): ReactElement<{ stream: Observable<a> }> => {
  const stream = useMemo(() => new ReplaySubject(), []);
  const stuff = useHook();

  if (observer) useEffect(() => stream.subscribe(observer).unsubscribe, []);
  useEffect(() => {
    if (!stream.closed) stream.next(stuff);
  });

  return <main data-stream={stream}></main>;
};

export const mountEffectful = <a,>(
  Component: ComponentType<a>,
  store: Store
): Observable<[StrMap<Resource<_>>, Function]> => {
  let wrapper: ReactWrapper;

  act(() => {
    wrapper = mount(WithStore(Component, { store }));
  });

  const stream: Observable<[StrMap<Resource<_>>, Function]> = wrapper!
    .find('main')
    .prop('data-stream');

  return wrapper!.update(), stream;
};
