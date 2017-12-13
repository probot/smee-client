import React, { Component } from 'react'
import ListItem from './ListItem'
import get from 'get-value'

function compare (a, b) {
  if (a.timestamp < b.timestamp) return 1
  if (a.timestamp > b.timestamp) return -1
  return 0
}
export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = { log: [], filter: '' }
  }

  componentDidMount () {
    this.setupEventSource()
  }

  setupEventSource () {
    const url = window.location.pathname
    console.log('Connecting to event source:', url)
    this.events = new window.EventSource(url)
    this.events.onmessage = this.onmessage.bind(this)
    this.events.onerror = this.onerror.bind(this)
  }

  onerror (err) {
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
    if (this.state.log.every(l => l[idProp] === json[idProp])) {
      this.setState({
        log: [...this.state.log, json]
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
          if (!searchString.startsWith('payload')) searchString = `payload.${searchString}`
          return get(l, searchString) === value
        }
        return true
      })
    }
    const sorted = filtered.sort(compare)

    return (
      <main>
        <div className="py-2 bg-gray-dark">
          <div className="container-md text-white p-responsive d-flex flex-items-center flex-justify-between">
            <h1 className="f4">Recent Deliveries</h1>
          </div>
        </div>
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
          {log.length > 0 ? (
            <ul className="Box list-style-none pl-0">
              {sorted.map((item, i, arr) => <ListItem key={item['x-github-delivery']} item={item} last={i === arr.length - 1} />)}
            </ul>
          ) : (
            <div className="blankslate">
              <h3>No events just yet</h3>
              <p>This page will automatically update as things happen.</p>
            </div>
          )}
        </div>
      </main>
    )
  }
}
