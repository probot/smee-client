#!/usr/bin/env node

const program = require('commander')
const Proxy = require('..')

program
  .usage('[options]')
  .option('-u, --url <url>', 'URL of the webhook proxy service', 'http://github-webhook-proxy.herokuapp.com/')
  .option('-p, --port <n>', 'Local HTTP server port', process.env.PORT || 3000)
  .option('-P, --path <path>', 'URL path to post proxied requests to`', '/')
  .parse(process.argv)

const source = program.url
const target = `http://127.0.0.1:${program.port}${program.path}`

const proxy = new Proxy({source, target})
proxy.start()
