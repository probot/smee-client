import React, { Component } from 'react'
import ListItem from './ListItem'
import get from 'get-value'
import { AlertIcon, PulseIcon } from 'react-octicons'
import Blank from './Blank'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.channel = window.location.pathname.substring(1)
    this.storageLimit = 30

    const ref = localStorage.getItem(`smee:log:${this.channel}`)
    this.state = { log: ref ? JSON.parse(ref) : [], filter: '', connection: false }
  }

  componentDidMount () {
    this.setupEventSource()
  }

  setupEventSource () {
    const url = window.location.pathname
    console.log('Connecting to event source:', url)
    this.events = new window.EventSource(url)
    this.events.onopen = this.onopen.bind(this)
    this.events.onmessage = this.onmessage.bind(this)
    this.events.onerror = this.onerror.bind(this)
  }

  onopen (data) {
    this.setState({
      connection: true
    })
  }

  onerror (err) {
    this.setState({
      connection: false
    })
    switch (this.events.readyState) {
      case window.EventSource.CONNECTING:
        console.log('Reconnecting...', err)
        break
      case window.EventSource.CLOSED:
        console.log('Reinitializing...', err)
        this.setupEventSource()
        break
    }
  }

  onmessage (message) {
    console.log('received message!')
    const json = JSON.parse(message.data)

    // Prevent duplicates in the case of redelivered payloads
    const idProp = 'x-github-delivery'
    if (this.state.log.findIndex(l => l[idProp] === json[idProp]) === -1) {
      this.setState({
        log: [json, ...this.state.log]
      }, () => {
        localStorage.setItem(`smee:log:${this.channel}`, JSON.stringify(this.state.log.slice(0, this.storageLimit)))
      })
    }
  }

  render () {
    const { log, filter } = this.state
    let filtered = log
    if (filter) {
      filtered = log.filter(l => {
        if (filter && filter.includes(':')) {
          let [searchString, value] = filter.split(':')
          if (!searchString.startsWith('body')) searchString = `body.${searchString}`
          console.log(l, searchString, value)
          return get(l, searchString) === value
        }
        return true
      })
    }

    const stateString = this.state.connection ? 'Connected' : 'Not Connected'
    return (
      <main>
        <div className="py-2 bg-gray-dark">
          <div className="container-md text-white p-responsive d-flex flex-items-center flex-justify-between">
            <h1 className="f4">Recent Deliveries</h1>
            <div className="flex-items-right tooltipped tooltipped-w" aria-label={stateString + ' to event stream'}>
              {this.state.connection
              ? <PulseIcon
                style={{fill: '#6cc644'}} />
              : <AlertIcon
                style={{fill: 'yellow'}} />
              }
            </div>
          </div>
        </div>

        {log.length > 0 ? (
          <div className="container-md py-3 p-responsive">
            <div className="mb-2">
              <div className="d-flex flex-items-center">
                <label htmlFor="search">Filter deliveries</label>
                <a className="ml-2 f6" href="https://github.com/jonschlinkert/get-value" target="_blank" rel="noopener noreferrer">Uses the get-value syntax</a>
              </div>
              <input
                type="text"
                id="search"
                placeholder="repository.name:probot"
                value={filter}
                onChange={e => this.setState({ filter: e.target.value })}
                className="input input-lg width-full Box"
              />
            </div>
            <ul className="Box list-style-none pl-0">
              {filtered.map((item, i, arr) => <ListItem key={item['x-github-delivery']} item={item} last={i === arr.length - 1} />)}
            </ul>
          </div>
        ) : <Blank />}
      </main>
    )
  }
}
