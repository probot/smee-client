#!/usr/bin/env node

const program = require('commander')
const Client = require('..')

program
  .usage('[options]')
  .option('-u, --url <url>', 'URL of the webhook proxy service', 'https://smee.io/')
  .option('-p, --port <n>', 'Local HTTP server port', process.env.PORT || 3000)
  .option('-P, --path <path>', 'URL path to post proxied requests to`', '/')
  .parse(process.argv)

const source = program.url
const target = `http://127.0.0.1:${program.port}${program.path}`

const client = new Client({source, target})
client.start()
