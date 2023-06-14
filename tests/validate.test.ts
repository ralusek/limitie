import createLimitie from '../src';
import { Limitie, LimitieConfig } from '../src/types';

describe('createLimitie function', () => {
  let limitie: Limitie;
  let config: LimitieConfig;

  beforeEach(() => {
    config = {
      tokens: {
        max: 10,
        regen: 2,
        initial: 5,
      },
      interval: 1000,
    };

    limitie = createLimitie(config);
  });

  it('creates an instance of Limitie', () => {
    expect(limitie).toBeDefined();
  });

  it('throws error for invalid max tokens', () => {
    config.tokens.max = -1;
    expect(() => createLimitie(config)).toThrowError('tokens.max must be greater than 0.');
  });

  it('throws error for invalid regen tokens', () => {
    config.tokens.regen = -1;
    expect(() => createLimitie(config)).toThrowError('tokens.regen must be greater than 0.');
  });

  it('throws error for invalid interval', () => {
    config.interval = -1;
    expect(() => createLimitie(config)).toThrowError('interval must be greater than 0.');
  });

  it('throws error when reserving more tokens than max', () => {
    expect(() => limitie.reserve(config.tokens.max + 1)).toThrowError(`Unable to reserve ${config.tokens.max + 1} number of tokens, max tokens specified in config is ${config.tokens.max}.`);
  });

  it('throws error for invalid reservation ID', () => {
    expect(() => limitie.getTimeUntilReady('invalid_id')).toThrowError('Unable to find reservation with id invalid_id.');
  });

  it('throws an error when trying to cancel a non-existing reservation', () => {
    expect(() => limitie.cancel("nonExistingId")).toThrowError();
  });  
});
