const fs = require('fs')
const path = require('path')

module.exports = log => {
  if (fs.existsSync(path.join(__dirname, '..', 'log.json'))) {
    const {logs} = require('../log.json')
    logs.forEach(l => log.add(l))
  }
}
