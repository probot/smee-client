import React, { Component } from 'react'
import ListItem from './ListItem'
import { object } from 'prop-types'

export default class App extends Component {
  static propTypes = {
    socket: object.isRequired
  }

  constructor (props) {
    super(props)
    this.state = { log: {} }
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
    const {log} = this.state
    return (
      <div className="container-lg">
        <ul className="Box list-style-none p-4">
          {Object.keys(log).map(key => <ListItem key={key} item={log[key]} />)}
        </ul>
      </div>
    )
  }
}
