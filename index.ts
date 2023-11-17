import validator from 'validator'
import EventSource from 'eventsource'
import superagent from 'superagent'
import url from 'url'
import querystring from 'querystring'

type Severity = 'info' | 'error'

interface Options {
  source: string
  target: string
  logger?: Pick<Console, Severity>
}

class Client {
  source: string;
  target: string;
  logger: Pick<Console, Severity>;
  events!: EventSource;

  constructor ({ source, target, logger = console }: Options) {
    this.source = source
    this.target = target
    this.logger = logger!

    if (!validator.isURL(this.source)) {
      throw new Error('The provided URL is invalid.')
    }
  }

  static async createChannel () {
    return superagent.head('https://smee.io/new').redirects(0).catch((err) => {
      return err.response.headers.location
    })
  }

  onmessage (msg: any) {
    const data = JSON.parse(msg.data)

    const target = url.parse(this.target, true)
    const mergedQuery = Object.assign(target.query, data.query)
    target.search = querystring.stringify(mergedQuery)

    delete data.query

    const req = superagent.post(url.format(target)).send(data.body)

    delete data.body

    Object.keys(data).forEach(key => {
      req.set(key, data[key])
    })

    req.end((err, res) => {
      if (err) {
        this.logger.error(err)
      } else {
        this.logger.info(`${req.method} ${req.url} - ${res.status}`)
      }
    })
  }

  onopen () {
    this.logger.info('Connected', this.events.url)
  }

  onerror (err: any) {
    this.logger.error(err)
  }

  start () {
    const events = new EventSource(this.source);

    // Reconnect immediately
    (events as any).reconnectInterval = 0 // This isn't a valid property of EventSource

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    this.logger.info(`Forwarding ${this.source} to ${this.target}`)
    this.events = events

    return events
  }
}

export = Client
