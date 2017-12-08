const EventSource = require('eventsource')
const superagent = require('superagent')

module.exports = class Proxy {
  constructor ({source, target}) {
    this.source = source
    this.target = target
  }

  onmessage (msg) {
    const data = JSON.parse(msg.data)

    const req = superagent.post(this.target).send(data.body)

    delete data.body

    Object.keys(data).forEach(key => {
      req.set(key, data[key])
    })

    req.end((err, res) => {
      if (err) {
        console.error(err)
      } else {
        console.log(`${req.method} ${req.url} - ${res.statusCode}`)
      }
    })
  }

  onopen () {
    console.log('Connected', this.events.url)
  }

  onerror (err) {
    console.error(err)
  }

  start () {
    const events = new EventSource(this.source)

    // Reconnect immediately
    events.reconnectInterval = 0

    events.addEventListener('message', this.onmessage.bind(this))
    events.addEventListener('open', this.onopen.bind(this))
    events.addEventListener('error', this.onerror.bind(this))

    console.log(`Proxying requests from ${this.source} to ${this.target}`)

    this.events = events

    return events
  }
}
