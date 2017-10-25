const express = require('express')
const path = require('path')
const server = require('http').Server
const socketio = require('socket.io')

const logEvent = require('./lib/logEvent')
const populateLog = require('./lib/populateLog')
const {mapToObj} = require('./lib/helpers')

const log = new Map()

// If in a development environment, populate the
// in-memory log with the on-file log.
if (process.env.NODE_ENV === 'development') {
  populateLog(log)
}

module.exports = (robot) => {
  const app = robot.route()
  const s = server(app)
  const io = socketio(s)

  s.listen(8080)

  robot.on('*', context => {
    const newLog = logEvent(context, log)
    if (newLog) io.sockets.emit('new-log', newLog)
  })

  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('/grapple/logs', (req, res) => res.json(mapToObj(log)))
  app.post('/grapple/redeliver', (req, res) => {
    const event = log.get(req.body.id)
    robot.receive(event)
  })
}
