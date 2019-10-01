import { reducers } from './reducers';
import { hook } from './use-resources';
import { Config } from './types';
import { PREFIX } from './constants';

export const Recubed = (cfg: Config) => ({
  hook: hook(cfg),
  reducer: {
    [PREFIX]: reducers
  }
});
