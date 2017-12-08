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
    const events = new window.EventSource(window.location.pathname)

    events.addEventListener('ready', message => {
      const json = JSON.parse(message.data)
      this.setState({ ready: true, listeners: json.count })
    })

    events.addEventListener('counter', message => {
      const json = JSON.parse(message.data)
      console.log(json)
      this.setState({ listeners: json.count })
    })

    events.onmessage = message => {
      const json = JSON.parse(message.data)

      // Prevent duplicates in the case of redelivered payloads
      if (this.state.log.findIndex(l => l.id === json['x-request-id']) === -1) {
        this.setState({
          log: [...this.state.log, json]
        })
      }
    }
  }

  render () {
    const { log, filter, ready, listeners } = this.state

    if (!ready) {
      return (
        <main>
          <h1>Loading...</h1>
        </main>
      )
    }

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
          <div className="Box Box--condensed">
            <div className="Box-header">
              <h3 className="Box-title">
                Active listeners <span className="Counter Counter--gray">{listeners - 1}</span>
              </h3>
            </div>
            {log.length > 0 ? (
              <ul className="Box-content list-style-none pl-0">
                {sorted.map((item, i, arr) => <ListItem key={item['x-github-delivery']} item={item} last={i === arr.length - 1} />)}
              </ul>
            ) : (
              <div className="blankslate blankslate-clean-background">
                <h3>No events just yet</h3>
                <p>This page will automatically update as things happen.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    )
  }
}
