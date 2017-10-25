const fs = require('fs')
const path = require('path')

module.exports = (context, log) => {
  // Prevent duplicate logs, in case they
  // are redelivered via the GitHub UI
  if (!log.has(context.id)) {
    // Generate the new object
    const newLog = {
      event: context.event,
      payload: context.payload,
      protocol: context.protocol,
      host: context.host,
      url: context.url
    }

    log.set(context.id, newLog)

    // Cap the log map at 50 entries
    // @todo Make the log cap length configurable
    if (log.size > 50) {
      const first = log.keys().next().value
      log.delete(first)
    }

    // If in development, also store the logs
    // in a local file for persistence
    if (process.env.NODE_ENV === 'development') {
      const obj = { [context.id]: newLog }
      const pathToLogs = path.join(__dirname, '..', 'logs.json')

      try {
        // If the file already exists, require and update it
        const logs = require('../logs.json')
        const newLogs = {...logs, obj}
        const ret = JSON.stringify(newLogs, null, 2)
        fs.writeFileSync(pathToLogs, ret, 'utf8')
      } catch (e) {
        // If the file does not exist, make a new file
        const ret = JSON.stringify(obj, null, 2)
        fs.writeFileSync(pathToLogs, ret, 'utf8')
      }
    }
  }
}
