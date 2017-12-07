const sse = require('connect-sse')()
const express = require('express')
const crypto = require('crypto')
const bodyParser = require('body-parser')
const EventEmitter = require('events')
const path = require('path')

module.exports = () => {
  const events = new EventEmitter()
  const app = express()

  app.use(bodyParser.json())
  app.use('/public', express.static(path.join(__dirname, '..', 'public')))

  app.get('/', (req, res) => {
    const channel = crypto
      .randomBytes(12)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '~')
    res.redirect(channel)
  })

  app.get('/:channel', (req, res, next) => {
    if (req.accepts('html')) {
      res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
    } else {
      next()
    }
  }, sse, (req, res) => {
    // Allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*')

    const channel = req.params.channel

    // Listen for events on this channel
    events.on(channel, res.json)

    res.on('close', () => {
      events.removeListener(channel, res.json)
      console.log('Client disconnected', channel, events.listenerCount(channel))
    })

    console.log('Client connected', channel, events.listenerCount(channel))
  })

  app.post('/:channel', (req, res) => {
    events.emit(req.params.channel, {
      ...req.headers,
      body: req.body
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
