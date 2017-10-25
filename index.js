const logEvent = require('./lib/logEvent')
// const emitSocketEvent = require('./lib/emitSocketEvent')
const populateLog = require('./lib/populateLog')

const log = new Map()

if (process.env.NODE_ENV === 'development') {
  populateLog(log)
}

module.exports = (robot) => {
  robot.on('*', context => {
    logEvent(context, log)
    // emitSocketEvent(context, log)
  })

  const app = robot.route()
  app.get('/', (req, res) => {
    res.end('Hello!')
  })
}
