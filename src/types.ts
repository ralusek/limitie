export type Limitie = {
  // Reserve tokens. Returns a promise that resolves when the reservation is ready.
  reserve: (tokens?: number) => {
    id: string;
    promise: Promise<null>;
  };
  // Higher level API for reserving a single token.
  request: () => Promise<null>;
  // Remove reservation.
  cancel: (reservationId: string) => void;
  // Update the number of pooled tokens. Useful for updating the number of tokens from an external source.
  update: (pooled: number) => void;
  // Gets the number of pooled tokens.
  getPooledTokens: () => number;
  // Gets time, in ms, until the reservation is ready.
  getTimeUntilReady: (reservationId?: string) => number;
};

export type LimitieConfig = {
  // Interval, in ms, after which regen is added to pooled tokens. Defaults to 1000.
  interval?: number; // in ms
} & AtLeastOne<{
  tokens: {
    // Number of tokens to add every interval.
    regen: number;
    // Maximum number of tokens. Defaults to regen.
    max?: number;
    // Initial number of tokens. Defaults to max.
    initial?: number;
  };
  // Higher level abstraction than tokens. These are both equivalent to 10 requests per second
  // { tokens: { regen: 10, max: 10 }, interval: 1000 }
  // { requests: 10, interval: 1000 }
  requests: number;
}>

export type LimitieReservation = {
  id: string;
  tokens: number;
  callback: () => void;
};

export type AtLeastOne<T> = Partial<T> & { [K in keyof T]: Required<Pick<T, K>> }[keyof T];
