# NAME &middot; [![Build Status](https://img.shields.io/travis/probot/webhooks/master.svg)](https://travis-ci.org/probot/webhooks) [![Codecov](https://img.shields.io/codecov/c/github/probot/webhooks.svg)](https://codecov.io/gh/probot/webhooks/)

`NAME` is a web application that receives payloads then sends them, via the [EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) API, to other clients.

< IMAGE SCREENSHOT >

## Motivation

One of the most cumbersome parts of building a GitHub App with [Probot](https://probot.github.io) is dealing with webhook deliveries. When working locally, for your app to receive webhooks you'd need to expose it to the internet - that's where we've used [localtunnel](https://localtunnel.me). However, it's not very reliable or fast and is more than many apps need to simply collect webhook events.

This also gave us a way to build our own UI around the needs of a Probot App. Together with the GitHub App UI, we now have a better way to get the full picture of what goes on in an app in development.

## Setup

```
# Install dependencies
npm install

# Run the server
npm start
```
