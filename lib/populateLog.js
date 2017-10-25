const fs = require('fs')
const path = require('path')

/**
 * Populates the in-memory log from the on-file log
 * @param {Map<string, any>} log - Log map
 */
module.exports = log => {
  // Check to make sure that the log file exists before requiring it
  if (fs.existsSync(path.join(__dirname, '..', 'log.json'))) {
    const logs = require('../log.json')
    Object.keys(logs).forEach(key => log.set(key, logs[key]))
  }
}
