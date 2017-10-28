import React, { Component } from 'react'
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
    return (
      <ul>
        {Object.keys(this.state.log).map(key => <li key={key}>{key}</li>)}
      </ul>
    )
  }
}
