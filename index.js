const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const passport = require('passport')
const session = require('express-session')
const logEvent = require('./lib/logEvent')
const populateLog = require('./lib/populateLog')
const routes = require('./lib/routes')

const log = new Map()

module.exports = async (robot) => {
  require('./lib/passport')

  const app = robot.server
  const io = socketio(robot.http)

  app.use(session({ secret: process.env.OAUTH_SECRET, resave: false, saveUninitialized: false }))
  app.use(passport.initialize())
  app.use(passport.session())

  // If in a development environment, populate the
  // in-memory log with the on-file log.
  if (process.env.NODE_ENV === 'development') {
    robot.log('Populating in-memory log')
    populateLog(log)
  }

  robot.on('*', context => {
    const newLog = logEvent(context, log)
    if (newLog) io.sockets.emit('new-log', newLog)
  })

  const router = robot.route()
  router.use(express.static(path.join(__dirname, 'dist')))
  routes(robot, app, log)
}
