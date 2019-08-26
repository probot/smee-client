const validator = require('validator')
const EventSource = require('eventsource')
const superagent = require('superagent')
const url = require('url')
const querystring = require('querystring')

// add timestamps in front of log messages in UTC format
require('log-timestamp');

class Client {
  constructor ({ source, target, logger = console }) {
    this.source = source
    this.target = target
    this.logger = logger

    if (!validator.isURL(this.source)) {
      throw new Error('The provided URL is invalid.')
    }
  }

  onmessage (msg) {
    const data = JSON.parse(msg.data)
	var payload = JSON.stringify(data.body)
	var remoteAdd = JSON.stringify(msg.origin)
    this.logger.info(`[UTC] Webhook payload received from ${remoteAdd}: ${payload}`) 

    const target = url.parse(this.target, true)
    const mergedQuery = Object.assign(target.query, data.query)
    target.search = querystring.stringify(mergedQuery)

    delete data.query

    const req = superagent.post(target).send(data.body)

    delete data.body

    Object.keys(data).forEach(key => {
      req.set(key, data[key])
    })

    req.end((err, res) => {
      if (err) {
        this.logger.error(err)
      } else {
        this.logger.info(`[UTC] ${req.method} ${req.url} - ${res.statusCode}`)
      }
    })
  }

  onopen () {
    this.logger.info('[UTC] Connected', this.events.url)
  }

  onerror (err) {
    this.logger.error(err)
  }

  start () {
	// Suport working behind corporate proxy, uses enviroment variable http_proxy, https_proxy
    require('global-tunnel-ng').initialize()
    this.logger.info(`[UTC] source ${this.source}`)
    const events = new EventSource(this.source)
    // Reconnect immediately
    events.reconnectInterval = 0

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))
    this.logger.info(`[UTC] Forwarding ${this.source} to ${this.target}`)
    this.events = events

    return events
  }
}

Client.createChannel = async () => {
  return superagent.head('https://smee.io/new').redirects(0).catch((err, res) => {
    return err.response.headers.location
  })
}

module.exports = Client
