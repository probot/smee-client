import React from 'react'
import { render } from 'react-dom'
import io from 'socket.io-client'
import './style.scss'
import App from './components/App'

const socket = io()

render(<App socket={socket} />, document.querySelector('.mount'))
