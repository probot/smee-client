import React, { Component } from 'react'
import { render } from 'react-dom'
import io from 'socket.io-client'
import './style.scss'

class App extends Component {
  constructor (props) {
    super(props)
    this.state = { log: {} }
  }

  componentDidMount () {
    window.fetch('/grapple/logs').then(res => res.json()).then(log => {
      this.setState({ log })
    })

    const socket = io('http://localhost:8080')
    socket.on('new-log', log => this.setState({ log: Object.assign({}, this.state.log, { [log.id]: log }) }))
  }

  render () {
    return (
      <ul>
        {Object.keys(this.state.log).map(key => <li key={key}>{key}</li>)}
      </ul>
    )
  }
}

render(<App />, document.querySelector('.mount'))
