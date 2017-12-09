const EventSource = require('eventsource')
const superagent = require('superagent')

module.exports = class Client {
  constructor ({source, target, logger = console}) {
    this.source = source
    this.target = target
    this.logger = logger
  }

  onmessage (msg) {
    const data = JSON.parse(msg.data)

    const req = superagent.post(this.target).send(data.body)

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
    const events = new EventSource(this.source)

    // Reconnect immediately
    events.reconnectInterval = 0

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    this.logger.info(`Proxying requests from ${this.source} to ${this.target}`)

    this.events = events

    return events
  }
}
