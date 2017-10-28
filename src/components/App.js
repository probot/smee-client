import React, { Component } from 'react'
import ListItem from './ListItem'
import { object } from 'prop-types'

export default class App extends Component {
  static propTypes = {
    socket: object.isRequired
  }

  constructor (props) {
    super(props)
    this.state = { log: {}, filter: '' }
  }

  componentDidMount () {
    window.fetch('/webhooks/logs').then(res => res.json()).then(log => {
      this.setState({ log })
    })

    this.props.socket.on('new-log', log => this.setState({
      log: Object.assign({}, this.state.log, { [log.id]: log })
    }))
  }

  render () {
    const {log, filter} = this.state
    const keys = Object.keys(log)
    const filtered = keys.filter(key => log[key].event.includes(filter))
    return (
      <main>
        <div className="py-4 bg-gray-dark">
          <div className="container-md text-white p-responsive">
            <h1 className="f4">Recent Deliveries</h1>
          </div>
        </div>
        <div className="container-md py-3 p-responsive">
          <input type="text" value={filter} onChange={e => this.setState({ filter: e.target.value })} className="input input-lg width-full mb-2 Box" placeholder="Filter by event" />
          <ul className="Box list-style-none pl-0">
            {filtered.map((key, i, arr) => <ListItem key={key} item={log[key]} last={i === arr.length - 1} />)}
          </ul>
        </div>
      </main>
    )
  }
}
