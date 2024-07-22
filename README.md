<h2 align="center">smee-client</h2>
<p align="center">Client and CLI for smee.io, a service that delivers webhooks to your local development environment.</p>
<p align="center"><a href="https://npmjs.com/package/smee-client"><img src="https://img.shields.io/npm/v/smee-client/latest.svg" alt="NPM"></a> <a href="https://travis-ci.com/probot/smee-client"><img src="https://badgen.now.sh/travis/probot/smee-client" alt="Build Status"></a> <a href="https://codecov.io/gh/probot/smee-client/"><img src="https://badgen.now.sh/codecov/c/github/probot/smee-client" alt="Codecov"></a></p>

<p align="center"><a href="https://github.com/probot/smee.io">Looking for <strong>probot/smee.io</strong>?</a></p>

## Installation

Install the client with:

```sh
npm install -g smee-client
```

## Usage

### CLI

The `smee` command will forward webhooks from smee.io to your local development environment.

```sh
smee
```

Run `smee --help` for usage.

### Node Client

```js
import SmeeClient from 'smee-client'

const smee = new SmeeClient({
  source: 'https://smee.io/abc123',
  target: 'http://localhost:3000/events',
  logger: console
})

const events = smee.start()

// Stop forwarding events
events.close()
```

#### Proxy Servers

By default, the `SmeeClient` API client does not make use of the standard proxy server environment variables. To add support for proxy servers you will need to provide an https client that supports them such as [`undici.ProxyAgent()`](https://undici.nodejs.org/#/docs/api/ProxyAgent).

For example, this would use a `ProxyAgent` to make requests through a proxy server:

```js
const { fetch: undiciFetch, ProxyAgent } = require('undici');
const SmeeClient = require('smee-client');

const myFetch = (url, options) => {
  return undiciFetch(url, {
    ...options,
    dispatcher: new ProxyAgent(<your_proxy_url>)
  })
};

const smee = new SmeeClient({
  fetch: myFetch
});
```
