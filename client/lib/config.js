const Channel = require('./channel')

class Config {
  constructor (options = {}) {
    this.options = options
    this.channels = []

    Object.keys(options.channels || []).forEach(channel => {
      this.channels.push(new Channel({
        source: `${this.host}/${channel}`,
        target: `http://127.0.0.1:${options.port}${options.channels[channel]}`
      }))
    })
  }

  get host () {
    return this.options.host || 'https://smee.io'
  }
}

Config.load = (defaults = {}) => {
  const rcfile = require('rcfile')
  return new Config(Object.assign({}, defaults, rcfile('smee')))
}

module.exports = Config
