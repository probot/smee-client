const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')
const KeepAlive = require('./keep-alive')
const request = require('request')
const querystring = require('querystring')
const {promisify} = require('util')
const post = promisify(request.post)
const get = promisify(request.get)
const cookieSession = require('cookie-session')

// Tiny logger to prevent logs in tests
const log = process.env.NODE_ENV === 'test' ? _ => _ : console.log

module.exports = () => {
  require('dotenv').config()
  const events = new EventEmitter()
  const app = express()
  const pubFolder = path.join(__dirname, 'public')

  if (process.env.FORCE_HTTPS) {
    app.use(require('helmet')())
    app.use(require('express-sslify').HTTPS({ trustProtoHeader: true }))
  }
  app.use(cookieSession({
    name: 'session',
    keys: ['key1'],
    secret: process.env.WEBHOOK_SECRET,
    maxAge: 30 * 24 * 60 * 60 * 1000
  }))
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({extended: true}))
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

    const params = querystring.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      redirect_uri: `${protocol}://${host}/auth/github/callback`,
      scope: 'user'
    })

    if (req.session.user) {
      res.redirect(302, '/' + req.session.user + `/${channel}`)
    } else {
      const url = `https://github.com/login/oauth/authorize?${params}`
      res.redirect(url)
    }
  })

  app.get('/auth/github/callback', async (req, res) => {
    // complete OAuth dance
    const tokenRes = await post({
      url: `https://github.com/login/oauth/access_token`,
      form: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: req.query.code,
        state: req.query.state
      },
      json: true
    })

    if (tokenRes.statusCode === 200) {
      req.session.token = tokenRes.body.access_token
      const userInfo = await get({
        url: 'https://api.github.com/user?access_token=' + tokenRes.body.access_token,
        headers: {
          'User-Agent': 'request'
        },
        json: true
      })
      const channel = crypto
        .randomBytes(12)
        .toString('base64')
        .replace(/[+/=]+/g, '')

      req.session.user = userInfo.body.login
      res.redirect(302, '/' + userInfo.body.login + `/${channel}`)
    }
  })

  app.get('/:channel', (req, res, next) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(pubFolder, 'webhooks.html'))
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

  // authenticated User

  app.get('/:username/:channel', (req, res, next) => {
    if (req.accepts('html')) {
      if (!req.session.user) {
        res.redirect('/')
      } else {
        if (req.session.user === req.params.username) {
          res.sendFile(path.join(pubFolder, 'webhooks.html'))
        } else {
          res.json({
            message: 'Sorry you don\'t have access to this URL'
          })
        }
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

    const channel = req.params.username + '/' + req.params.channel

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

  // For authenticated user

  app.post('/:user/:channel', (req, res) => {
    events.emit(req.params.user + '/' + req.params.channel, {
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

  // for authenticated user

  app.post('/:user/:channel/redeliver', (req, res) => {
    events.emit(req.params.user + '/' + req.params.channel, req.body)
    res.status(200).end()
  })

  return app
}
