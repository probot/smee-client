
const EventSource = require('eventsource')
const superagent = require('superagent')

class Client {
  constructor ({source, target, logger = console}) {
    this.source = source
    this.target = target
    this.logger = logger
  }
  validateURL (value) {
    var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/
    return urlregex.test(value)
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
    if ((this.validateURL(this.source)) === true) {
      this.logger.error(err)
    }
  }

  start () {
    const events = new EventSource(this.source)

    // Reconnect immediately
    events.reconnectInterval = 0

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))
    if (this.validateURL(this.source) === true) {
      this.logger.info(`Forwarding ${this.source} to ${this.target}`)
      this.events = events

      return events
    } else {
      this.logger.error('Please check your WEBHOOK_PROXY_URL in .env file')
    }
  }
}

Client.createChannel = async () => {
  return superagent.head('https://smee.io/new').redirects(0).catch((err, res) => {
    return err.response.headers.location
  })
}

module.exports = Client
