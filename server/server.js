
const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const KeepAlive = require('./keep-alive')
const store = require('store')

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

module.exports = () => {
  const events = new EventEmitter()
  const app = express()
  const pubFolder = path.join(__dirname, 'public')

  if (process.env.FORCE_HTTPS) {
    app.use(require('helmet')())
    app.use(require('express-sslify').HTTPS({ trustProtoHeader: true }))
  }

  app.use(bodyParser.json())
  app.use(cookieParser())
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

    const secret = jwt.sign({token: channel}, 'secet')

    const decoded = jwt.verify(secret, 'secet')
    res.cookie('jwtToken',decoded, { maxAge : 90000000})
    store.set('token',decoded)
    res.redirect(307, `${protocol}://${host}/${channel}`)
  })


  app.get('/:channel', (req, res, next) => {
    if (req.accepts('html')) {
      if(typeof req.cookies.jwtToken !== 'undefined'){
        if(req.cookies.jwtToken.token === store.get('token').token) {
            res.sendFile(path.join(pubFolder, 'webhooks.html'))
        } else {
          res.json({
            message : 'wrong header'
          })
        }
      } else {
      res.json({
        message : 'Sorry this channel is already under use'
      })
    }
    } else {
      next()
    }
  }, sse, (req, res) => {
    function send (data) {
      res.json(data)
      keepAlive.reset()
    }

    function close () {
      events.removeListener(channel, send)
      keepAlive.stop()
      log('Client disconnected', channel, events.listenerCount(channel))
    }

    const channel = req.params.channel

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
