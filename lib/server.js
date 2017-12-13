const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

module.exports = () => {
  const events = new EventEmitter()
  const app = express()
  const pubFolder = path.join(__dirname, '..', 'public')

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
    const channel = crypto
      .randomBytes(12)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '~')
    res.redirect(307, channel)
  })

  app.get('/:channel', (req, res, next) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(pubFolder, 'webhooks.html'))
    } else {
      next()
    }
  }, sse, (req, res) => {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json({}, 'ready')

    const channel = req.params.channel

    // Listen for events on this channel
    events.on(channel, res.json)

    res.on('close', () => {
      events.removeListener(channel, res.json)
      log('Client disconnected', channel, events.listenerCount(channel))
    })

    log('Client connected', channel, events.listenerCount(channel))
  })

  app.post('/:channel', (req, res) => {
    events.emit(req.params.channel, {
      ...req.headers,
      body: req.body,
      timestamp: Date.now()
    })
    res.status(200).end()
  })

  // Resend payload via the event emitter
  app.post('/:channel/redeliver', (req, res) => {
    events.emit(req.params.channel, req.body)
    res.status(200).end()
  })

  return app
}
