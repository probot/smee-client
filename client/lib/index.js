const Config = require('./config')

module.exports = class Client {
  constructor (options) {
    this.config = Config.load(options)
  }

  start () {
    this.config.channels.forEach(channel => {
      channel.start()
    })
  }
}
