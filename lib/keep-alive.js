module.exports = class KeepAlive {
  constructor (callback, delay) {
    this.callback = callback
    this.delay = delay
  }

  start () {
    this.id = setInterval(this.callback, this.delay)
  }

  stop () {
    clearInterval(this.id)
  }

  reset () {
    this.stop()
    this.start()
  }
}
