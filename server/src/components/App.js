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
    const handlers = {
      'moveUp': (e) => console.log('pressed up'),
      'moveDown': (e) => console.log('pressed down'),
      'open': (e) => console.log('pressed open'),
      'pin': (e) => console.log('pressed pin'),
      'redeliver': (e) => console.log('pressed redeliver')
    }

    return (
      <HotKeys keyMap={keyMap} handlers={handlers} focused>
        <Deliveries />
      </HotKeys>
    )
  }
}
