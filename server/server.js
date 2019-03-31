const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')
const Raven = require('raven')

const Cache = require('./redis')
const KeepAlive = require('./keep-alive')

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

module.exports = (testRoute) => {
  const events = new EventEmitter()
  const app = express()
  const pubFolder = path.join(__dirname, 'public')
  const cache = new Cache()

  // Used for testing route error handling
  if (testRoute) testRoute(app)

  if (process.env.SENTRY_DSN) {
    Raven.config(process.env.SENTRY_DSN).install()
    app.use(Raven.requestHandler())
  }

  if (process.env.FORCE_HTTPS) {
    app.use(require('helmet')())
    app.use(require('express-sslify').HTTPS({ trustProtoHeader: true }))
  }

  app.use(bodyParser.json())
  app.use('/public', express.static(pubFolder))

  app.get('/', (req, res) => {
    res.sendFile(path.join(pubFolder, 'index.html'))
  })

  app.get('/new', (req, res) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const channel = crypto
      .randomBytes(12)
      .toString('base64')
      .replace(/[+/=]+/g, '')

    res.redirect(307, `${protocol}://${host}/${channel}`)
  })

  app.get('/:channel', (req, res, next) => {
    const { channel } = req.params
    const bannedChannels = process.env.BANNED_CHANNELS && process.env.BANNED_CHANNELS.split(',')
    if (bannedChannels && bannedChannels.includes(channel)) {
      return res.status(403).send('Channel has been disabled due to too many connections.')
    }

    if (req.accepts('html')) {
      log('Client connected to web', channel, events.listenerCount(channel))
      res.sendFile(path.join(pubFolder, 'webhooks.html'))
    } else {
      next()
    }
  }, sse, (req, res) => {
    const { channel } = req.params

    function send (data) {
      res.json(data)
      keepAlive.reset()
    }

    function close () {
      events.removeListener(channel, send)
      keepAlive.stop()
      log('Client disconnected', channel, events.listenerCount(channel))
    }

    // Setup interval to ping every 30 seconds to keep the connection alive
    const keepAlive = new KeepAlive(() => res.json({}, 'ping'), 30 * 1000)
    keepAlive.start()

    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Listen for events on this channel
    events.on(channel, send)

    // Clean up when the client disconnects
    res.on('close', close)

    res.json({}, 'ready')

    log('Client connected to sse', channel, events.listenerCount(channel))
  })

  app.post('/:channel', async (req, res) => {
    const timestamp = Date.now()
    events.emit(req.params.channel, {
      ...req.headers,
      body: req.body,
      timestamp
    })

    const id = req.headers['x-github-delivery'] || req.headers['X-GitHub-Delivery'] || timestamp
    res.status(200).end()
    cache.setForChannel(req.params.channel, id, req.body)
  })

  // Resend payload via the event emitter
  app.post('/:channel/redeliver', (req, res) => {
    events.emit(req.params.channel, req.body)
    res.status(200).end()
  })

  // Get all payloads stored in Redis for a given channel
  app.get('/:channel/cache', async (req, res) => {
    const values = await cache.getAllForChannel(req.params.channel)
    res.json(values)
  })

  if (process.env.SENTRY_DSN) {
    app.use(Raven.errorHandler())
  }

  return app
}
