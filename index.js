const express = require('express')
const path = require('path')
const socketio = require('socket.io')

const logEvent = require('./lib/logEvent')
const populateLog = require('./lib/populateLog')
const {mapToObj} = require('./lib/helpers')

const log = new Map()

module.exports = (robot) => {
  // If in a development environment, populate the
  // in-memory log with the on-file log.
  if (process.env.NODE_ENV === 'development') {
    robot.log('Populating in-memory log')
    populateLog(log)
  }

  const app = robot.route()
  const io = socketio(robot.server)

  robot.on('*', context => {
    const newLog = logEvent(context, log)
    if (newLog) io.sockets.emit('new-log', newLog)
  })

  app.use(express.static(path.join(__dirname, 'dist')))
  app.get('/webhooks/logs', (req, res) => res.json(mapToObj(log)))
  app.post('/webhooks/logs/:id', (req, res) => {
    const event = log.get(req.params.id)
    robot.receive(event)
  })
}
