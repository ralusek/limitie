export type Limitie = {
  // Reserve tokens. Returns a promise that resolves when the reservation is ready.
  reserve: (tokens?: number) => {
    id: string;
    promise: Promise<null>;
  };
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
  tokens: {
    // Maximum number of tokens.
    max: number;
    // Number of tokens to add every interval.
    regen: number;
    // Initial number of tokens. Defaults to max.
    initial?: number;
  };
  // Interval, in ms, after which regen is added to pooled tokens. Defaults to 1000.
  interval?: number; // in ms
};

export type LimitieReservation = {
  id: string;
  tokens: number;
  callback: () => void;
};
