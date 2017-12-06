import React, { Component } from 'react'
import ListItem from './ListItem'
import { object } from 'prop-types'
import get from 'get-value'

function compare (a, b) {
  if (a.timestamp < b.timestamp) return 1
  if (a.timestamp > b.timestamp) return -1
  return 0
}

export default class App extends Component {
  static propTypes = {
    socket: object.isRequired
  }

  constructor (props) {
    super(props)
    this.state = { log: [], filter: '', loading: true }
  }

  componentDidMount () {
    window.fetch('/webhooks/logs', { credentials: 'same-origin' }).then(res => res.json()).then(res => {
      if (res.loggedIn === false) { window.location = '/probot/login' }
      this.setState({ log: res.log, user: res.user, loading: false })
    })

    this.props.socket.on('new-log', log => this.setState({
      log: [...this.state.log, log]
    }))
  }

  render () {
    const { log, user, filter, loading } = this.state
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
            {!loading && (
              <div className="d-flex flex-items-center">
                <h5 className="mr-2">{user.username}</h5>
                <img src={`${user.photos[0].value}&s=88`} width={32} />
              </div>
            )}
          </div>
        </div>
        <div className="container-md py-3 p-responsive">
          <label>
            Filter deliveries
            <input type="text" value={filter} onChange={e => this.setState({ filter: e.target.value })} className="input input-lg width-full mb-2 Box" placeholder="" />
          </label>
          <ul className="Box list-style-none pl-0">
            {sorted.map((l, i, arr) => <ListItem key={l.id} item={l} last={i === arr.length - 1} />)}
          </ul>
        </div>
      </main>
    )
  }
}
