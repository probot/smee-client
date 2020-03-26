const validator = require('validator')
const EventSource = require('eventsource')
const superagent = require('superagent')
const url = require('url')
const querystring = require('querystring')

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
        this.logger.info(`${req.method} ${req.url} - ${res.statusCode}`)
      }
    })
  }

  onopen () {
    this.logger.info('Connected', this.events.url)
  }

  onerror (err) {
    this.logger.error(err)
  }

  start () {
    var reject = false;
    if(process.env.NODE_TLS_REJECT_UNAUTHORIZED)
    {
      reject = true;
    }
    else
    {
      reject = true;
    }

    const events = new EventSource(this.source,{rejectUnauthorized: reject})

    // Reconnect immediately
    events.reconnectInterval = 0

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    this.logger.info(`Forwarding ${this.source} to ${this.target}`)
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
