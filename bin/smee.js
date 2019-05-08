#!/usr/bin/env node

const program = require('commander')
const { version } = require('../package.json')

const Client = require('..')

function collect (val, memo) {
  memo.push(val)
  return memo
}

program
  .version(version, '-v, --version')
  .usage('[options]')
  .option('-u, --url <url>', 'URL of the webhook proxy service. Default: https://smee.io/new')
  .option('-t, --target <target>', 'Full URL (including protocol and path) of the target service the events will forwarded to. Default: http://127.0.0.1:PORT/PATH')
  .option('-p, --port <n>', 'Local HTTP server port', process.env.PORT || 3000)
  .option('-P, --path <path>', 'URL path to post proxied requests to`', '/')
  .option('-H, --header <header>', 'HTTP header to add to the Jenkins request (i.e "X-Forwarded-User: smeebot"', collect, [])
  .parse(process.argv)

let target
if (program.target) {
  target = program.target
} else {
  target = `http://127.0.0.1:${program.port}${program.path}`
}

let headers = {}
program.header.forEach(function (h) {
  var _match = h.match(/^(.*): (.*)$/)
  if (!_match) {
    throw new Error('Provided header option is malformed')
  }
  headers[_match[1].trim()] = _match[2].trim()
})

async function setup () {
  let source = program.url

  if (!source) {
    source = await Client.createChannel()
  }

  const client = new Client({ source, target, headers })
  client.start()
}

setup()
