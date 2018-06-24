import React, {Component} from 'react'
import {HotKeys} from 'react-hotkeys'
import Deliveries from './Deliveries'

const keyMap = {
  moveDown: 'j',
  moveUp: 'k',
  open: 'o',
  pin: 'p',
  redeliver: 'r'
}

export default class App extends Component {
  render () {
    return (
      <HotKeys keyMap={keyMap}>
        <Deliveries />
      </HotKeys>
    )
  }
}
