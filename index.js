const io = require('socket.io')

const logEvent = require('./lib/logEvent')
const populateLog = require('./lib/populateLog')

const log = new Map()

// If in a development environment, populate the
// in-memory log with the on-file log.
if (process.env.NODE_ENV === 'development') {
  populateLog(log)
}

module.exports = (robot) => {
  const app = robot.route()
  io(app)

  robot.on('*', context => {
    const newLog = logEvent(context, log)
    io.sockets.emit('new-log', newLog)
  })

  app.get('/', (req, res) => {
    res.end('Hello!')
  })
}
