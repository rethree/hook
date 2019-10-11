import { markStale, saveFetched } from '../lib/reducers';

describe('markStale', () => {
  const state = {
    resource1: {
      data: 42,
      meta: {
        stale: false
      }
    },
    resource2: {
      data: 42,
      meta: {
        stale: false
      }
    }
  };

  test('sets stale to true for dependencies provided', () => {
    const reduced = markStale(state)([
      {
        url: 'resource1'
      },
      {
        url: 'resource2'
      }
    ]);

    expect(reduced['resource1'].meta.stale).toBe(true);
    expect(reduced['resource2'].meta.stale).toBe(true);
  });

  test('dependencies not provided are left untouched', () => {
    const reduced = markStale(state)([
      {
        url: 'resource1'
      }
    ]);

    expect(reduced['resource1'].meta.stale).toBe(true);
    expect(reduced['resource2'].meta.stale).toBe(false);
  });

  test('missing dependencies are added and marked as stale', () => {
    const reduced = markStale(state)([
      {
        url: 'resource1'
      },
      {
        url: 'resource3'
      }
    ]);

    expect(reduced['resource1'].meta.stale).toBe(true);
    expect(reduced['resource2'].meta.stale).toBe(false);
    expect(reduced['resource3'].meta.stale).toBe(true);
  });
});

describe('saveFetched', () => {
  const state = {
    resource1: {
      meta: {
        stale: true
      }
    },
    resource2: {
      meta: {
        stale: true
      }
    }
  };

  jest.spyOn(Date, 'now').mockImplementation(() => 9001);

  test('transforms responses provided into resources', () => {
    const reduced = saveFetched(state)([
      [
        {
          url: 'resource1',
          ttl: 30
        },
        {
          value: 42
        }
      ]
    ]);

    expect(reduced['resource1']).toEqual({
      data: 42,
      meta: {
        stale: false,
        ttl: 30,
        timestamp: 9001
      }
    });
  });

  test('transforms faults provided into resources', () => {
    const reduced = saveFetched(state)([
      [
        {
          url: 'resource1',
          ttl: 30
        },
        { fault: 42 }
      ]
    ]);

    expect(reduced['resource1']).toEqual({
      meta: {
        fault: 42,
        stale: false,
        ttl: 30,
        timestamp: 9001
      }
    });
  });
});
