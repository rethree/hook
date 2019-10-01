import React, { ComponentType, ReactElement, useEffect, useMemo } from "react";
import { Provider } from "react-redux";
import { Store } from "redux";
import { Observable, ReplaySubject } from "rxjs";

export const WithStore = <p extends object>(
  Component: ComponentType<typeof props>,
  { store, ...props }: p & { store: Store }
) => (
  <Provider store={store}>
    <Component {...props} />
  </Provider>
);

export const WillEmit = <a extends any>(
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
