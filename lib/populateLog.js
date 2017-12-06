const fs = require('fs')
const path = require('path')

/**
 * Populates the in-memory log from the on-file log
 * @param {Map<string, any>} log - Log map
 */
module.exports = log => {
  // Check to make sure that the log file exists before requiring it
  const logPath = path.join(__dirname, '..', 'logs.json')
  if (fs.existsSync(logPath)) {
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'))
    Object.keys(logs).forEach(key => {
      log.set(key, logs[key])
    })
  }
}
