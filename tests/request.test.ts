import createLimitie from '../src';
import { Limitie, LimitieConfig } from '../src/types';

describe('requests behavior', () => {
  // The previous tests go here...

  it('throws error if both tokens and requests are provided', () => {
    expect(() => createLimitie({
      tokens: { max: 10, regen: 2 },
      requests: 5,
      interval: 1000,
    })).toThrow('Cannot specify both tokens and requests in config.');
  });

  it('throws error if neither tokens nor requests are provided', () => {
    // @ts-expect-error
    expect(() => createLimitie({
      interval: 1000,
    })).toThrow('Must specify either tokens or requests in config.');
  });

  it('throws error if requests is not a number', () => {
    
    expect(() => createLimitie({
      // @ts-expect-error
      requests: 'a',
      interval: 1000,
    })).toThrow('requests must be a number.');
  });

  it('behaves correctly when requests is provided instead of tokens', async () => {
    const limitie = createLimitie({
      requests: 5,
      interval: 1000,
    });

    const { id, promise } = limitie.reserve(3);
    expect(id).toBeDefined();
    await expect(promise).resolves.toBeNull();
  });

  it('request function reserves one token', async () => {
    const limitie = createLimitie({
      tokens: {
        max: 10,
        regen: 2,
        initial: 5,
      },
      interval: 1000,
    });

    const promise = limitie.request();
    await expect(promise).resolves.toBeNull();
    expect(limitie.getPooledTokens()).toBe(4);
  });

  it('request function behaves as if passed as regen/max tokens', async () => {
    const limitie = createLimitie({
      requests: 5,
      interval: 1000,
    });

    expect(limitie.getPooledTokens()).toBe(5);
  
    const promises = Array.from({ length: 5 }).map(() => limitie.request());
    await Promise.all(promises);
  
    expect(limitie.getPooledTokens()).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  
    expect(limitie.getPooledTokens()).toBe(5);
  });
  
});
