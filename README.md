[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ralusek/limitie/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/limitie.svg?style=flat)](https://www.npmjs.com/package/limitie)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ralusek/limitie/blob/master/LICENSE)

# Installing
`$ npm install limitie`

## Requests per Interval
Lets say you have a site that only lets you make 10 requests per second across all of its API endpoints.
You could create a limiter for that service and use it in all of the methods for that service.

```typescript
import createLimitie from 'limitie';

// Create a rate limiter for this service, limiting all requests through this limiter to
// 10 per second.
// Any requests in excess of that amount will be queued up and updated when available.
const limitie = createLimitie({ requests: 10, interval: 1000 });

async function listItems() {
  await limitie.request();
  // List items from this service
}

async function getDetailedItem(itemId: string) {
  await limitie.request();
  // Get detailed info for this item
}
```

## Tokens per Interval
Tokens are a lower level abstraction than requests. This could be used for services that have a rate limit
in place of something like 50000 tokens per minute. In that case, you would build a rate limiter like this:

```typescript
import createLimitie from 'limitie';

// Create a rate limiter for this service, limiting all requests through this limiter to
// 50000 tokens per minute.
const limitie = createLimitie({
  tokens: {
    regen: 50000,
  },
  interval: 1000,
});

async function listItems() {
  // Here we use the lower level reserve API, where we can specify a specific number of tokens for this request.
  await limitie.reserve(10000).promise();
  // List items from this service
}

async function getDetailedItem(itemId: string) {
  // Here we use the lower level reserve API, where we can specify a specific number of tokens for this request.
  await limitie.reserve(500).promise();
  // Get detailed info for this item
}
```

## Full API

### Detailed token config
```typescript
// Create a rate limiter for this service, limiting all requests through this limiter to
// 50000 tokens per minute.
// This service starts us off at 0 tokens, though, so we have to wait for tokens to regen
// before we can make requests, so we pass tokens.initial of 0.
// This service also allows us to pool up tokens to a maximum of 99999, so we can pass
// tokens.max of 99999
const limitie = createLimitie({
  tokens: {
    max: 99999,
    regen: 50000,
    initial: 0,
  },
  interval: 1000,
});
```

### Getting time estimates
Let's say I've reserved to use 50 tokens, but I have to wait until they're available. This means
that the limiter has handled all of the reserved cases before mine, and that sufficient tokens
have pooled to accommodate the request.
```
const reservation = limitie.reserve(50);
// I can see the time left until this is handled by doing
const timeLeft = limitie.getTimeUntilReady(reservation.id);

// And it is awaited like this
await reservation.promise;
```


# Contributing
We welcome contributions! Please see our contributing guidelines for more information.

# License
MIT
