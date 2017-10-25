import React, { Component } from 'react'
import { render } from 'react-dom'
import './style.scss'

class App extends Component {
  render () {
    return <h1>Hello!</h1>
  }
}

render(<App />, document.querySelector('.mount'))
