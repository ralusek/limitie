// Types
import { Limitie, LimitieConfig, LimitieReservation } from './types';

export default function createLimitie(
  config: LimitieConfig
): Limitie {
  if (config.requests !== undefined) {
    if (config.tokens) throw new Error(`Cannot specify both tokens and requests in config.`);
    if (typeof config.requests !== 'number' || isNaN(config.requests)) throw new Error(`requests must be a number.`);
    config.tokens = {
      regen: config.requests,
    };
  }
  if (!config.tokens) throw new Error(`Must specify either tokens or requests in config.`);

  config = {
    tokens: {
      ...config.tokens,
      max: config.tokens.max ?? config.tokens.regen,
    },
    interval: config.interval ?? 1000,
  };

  if (typeof config.tokens.max !== 'number' || isNaN(config.tokens.max)) throw new Error(`tokens.max must be a number.`);
  if (typeof config.tokens.regen !== 'number' || isNaN(config.tokens.regen)) throw new Error(`tokens.regen must be a number.`);
  if (typeof config.interval! !== 'number' || isNaN(config.interval!)) throw new Error(`interval must be a number.`);
  if (!(config.tokens.max > 0)) throw new Error(`tokens.max must be greater than 0.`);
  if (!(config.tokens.regen > 0)) throw new Error(`tokens.regen must be greater than 0.`);
  if (!(config.interval! > 0)) throw new Error(`interval must be greater than 0.`);

  const id = `${ Math.random().toString(36).slice(2) }${ Date.now().toString(36) }`;
  const startedAt = Date.now();

  const state = {
    tokens: {
      pooled: config.tokens.initial ?? config.tokens.max,
    },
    lastRegen: startedAt,
  };

  // TODO change this to a linked list. Would improve .cancel performance,
  // as well as .shift performance inside of attempt().
  const reservations: LimitieReservation[] = [];

  let activeTimeout: NodeJS.Timeout | null = null;

  function attempt(): void {
    if (activeTimeout) {
      clearTimeout(activeTimeout);
      activeTimeout = null;
    }

    if (!reservations.length) return;
    const timeUntilNextReservation = getTimeUntilReady();

    // If true, we don't have enough tokens to fulfill the next reservation.
    if (timeUntilNextReservation) {
      activeTimeout = setTimeout(attempt, timeUntilNextReservation);
      return;
    }

    // We have enough tokens to fulfill the next reservation.
    const reservation = reservations.shift();
    // We update this before calling the callback, in case the callback wants to update the state
    // with a more correct number of tokens from an external source.
    update(state.tokens.pooled - reservation!.tokens);
    reservation!.callback();
  }

  function update(pooled: number) {
    state.tokens.pooled = pooled;

    setTimeout(attempt, 0);
  }

  function reserve(tokens: number = 1) {
    if (tokens > config.tokens!.max!) throw new Error(`Unable to reserve ${tokens} number of tokens, max tokens specified in config is ${config.tokens!.max}.`);
    const id = `${ Math.random().toString(36).slice(2) }${ Date.now().toString(36) }`;

    let deferred: ((arg: null) => void) | null = null;

    const promise = new Promise<null>((resolve) => deferred = resolve);

    // We do this here instead of inside the promise creation so that the reservation is
    // synchronously added to the queue prior to the promise being returned.
    reservations.push({
      id,
      tokens,
      callback: () => deferred!(null),
    });

    setTimeout(attempt, 0);

    return {
      id,
      promise,
    };
  }

  // Higher level API for reserving a single token.
  function request() {
    return reserve(1).promise;
  }

  function cancel(reservationId: string) {
    const reservationIndex = reservations.findIndex((reservation) => reservation.id === reservationId);
    if (reservationIndex === -1) throw new Error(`Unable to cancel reservation, could not find reservation with id ${reservationId}.`);
    reservations.splice(reservationIndex, 1);

    setTimeout(attempt, 0);
  }

  function getPooledTokens() {
    handleRegen();
    return state.tokens.pooled;
  }

  function handleRegen() {
    const intervalsSinceLastRegen = Math.floor((Date.now() - state.lastRegen) / config.interval!);
    const tokensRegenerated = intervalsSinceLastRegen * config.tokens!.regen;
    state.tokens.pooled = Math.min(state.tokens.pooled + tokensRegenerated, config.tokens!.max!);
    state.lastRegen = state.lastRegen + (intervalsSinceLastRegen * config.interval!);
  }

  // Gets time, in ms, until the reservation is ready.
  function getTimeUntilReady(
    // The reservation to check. If not provided, will return the time until the next reservation is ready.
    reservationId?: string,
  ) {
    const pooledTokens = getPooledTokens();

    let claimedTokens = 0;
    for (let i = 0; i < reservations.length; i++) {
      const reservation = reservations[i];
      claimedTokens += reservation.tokens;
      if (!reservationId || (reservation.id === reservationId)) {
        const tokenDeficit = pooledTokens - claimedTokens;
        if (tokenDeficit >= 0) return 0;
        return Math.ceil(Math.abs(tokenDeficit) / config.tokens!.regen) * config.interval!;
      }
    }

    throw new Error(`Unable to find reservation with id ${reservationId}.`);
  }

  const limitie: Limitie = {
    reserve,
    request,
    cancel,
    update,
    getPooledTokens,
    getTimeUntilReady,
  };

  return limitie;
}
