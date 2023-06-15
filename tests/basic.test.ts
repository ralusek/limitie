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

  it('creates a reservation', async () => {
    const { id, promise } = limitie.reserve(3);
    expect(id).toBeDefined();
    await expect(promise).resolves.toBeNull();
  });

  it('updates pooled tokens', () => {
    const pooledTokens = 3;
    limitie.update(pooledTokens);
    // Check that the pooled tokens have been updated correctly
    // Note: You'll need to make the pooled tokens accessible for this test, e.g., by adding a getter method
    expect(limitie.getPooledTokens()).toBe(pooledTokens);
  });

  it('is immediately ready if reserved amount is less than or equal to initial amount', () => {
    const { id } = limitie.reserve(5);
    const time = limitie.getTimeUntilReady(id);
    expect(time).toBe(0);
  });

  it('has a positive time until read if reserved amount is in excess of initial amount', async () => {
    const { id } = limitie.reserve(8);
    const time = limitie.getTimeUntilReady(id);
    expect(time).toBe(2000); // 1.5 seconds rounded up to 2 seconds
    limitie.cancel(id);

    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  it('will allow immediate execution of multiple reservations if initial amount is greater than or equal to the sum of reserved amounts', async () => {
    const { id: id1, promise: promise1 } = limitie.reserve(2);
    const { id: id2, promise: promise2 } = limitie.reserve(2);
    const { id: id3, promise: promise3 } = limitie.reserve(2);
    const { id: id4, promise: promise4 } = limitie.reserve(1);
    const { id: id5, promise: promise5 } = limitie.reserve(1);
    const time1 = limitie.getTimeUntilReady(id1);
    const time2 = limitie.getTimeUntilReady(id2);
    const time3 = limitie.getTimeUntilReady(id3);
    const time4 = limitie.getTimeUntilReady(id4);
    const time5 = limitie.getTimeUntilReady(id5);
    expect(time1).toBe(0);
    expect(time2).toBe(0);
    expect(time3).toBe(1000);
    expect(time4).toBe(1000);
    expect(time5).toBe(2000);

    const now = Date.now();
    expectTime(0);

    expect(limitie.getWaitTime()).toBe(2000);

    await promise1;
    expectTime(0);

    await promise2;
    expectTime(0);

    await promise3;
    expectTime(1000);

    await promise4;
    expectTime(1000);

    await promise5;
    expectTime(2000);

    expect(limitie.getWaitTime()).toBe(0);


    function expectTime(num: number) {
      const timeTaken = Date.now() - now;
      expect(timeTaken).toBeGreaterThan(num - 150);
      expect(timeTaken).toBeLessThan(num + 150);
    }
  });

  it('regenerates tokens over time', async () => {
    limitie.reserve(config.tokens!.max); // Use up all tokens
    expect(limitie.getPooledTokens()).toBe(5);
    // expect(limitie.getTokenBacklog()).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, (config.interval! * 2) + 150)); // Wait for 2 regen intervals (+ 150ms for buffer)
    // expect(limitie.getTokenBacklog()).toBe(config.tokens.regen * 2);
    expect(limitie.getPooledTokens()).toBe(9);

    // This will reach max tokens and finally consume them, dropping pooled tokens to 0
    await new Promise((resolve) => setTimeout(resolve, (config.interval! * 1) + 150)); // Wait for 1 regen interval (+ 150ms for buffer)
    expect(limitie.getPooledTokens()).toBe(0);
  });

  it('does not exceed maximum tokens after regen', async () => {
    await new Promise((resolve) => setTimeout(resolve, (config.interval! * 3) + 150)); // Wait for 3 regen intervals (+ 150ms for buffer)
    expect(limitie.getPooledTokens()).toBe(config.tokens!.max);
  });
});
