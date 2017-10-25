const fs = require('fs')
const path = require('path')

module.exports = (context, log) => {
  // Prevent duplicate logs, in case they
  // are redelivered via the GitHub UI
  if (!log.has(context.id)) {
    // Generate the new object
    // @todo Fill log object with more info
    const newLog = {
      payload: context.payload
    }

    log.set(context.id, newLog)

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
