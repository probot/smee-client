import React from 'react'
import App from '../src/components/App'
import Blank from '../src/components/Blank'
import { shallow } from 'enzyme'
import issuesOpened from './fixtures/issues.opened.json'
import issuesOpenedTwo from './fixtures/issues.opened2.json'

describe('<App />', () => {
  let localStorage, wrapper, consoleLog

  beforeEach(() => {
    localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn()
    }

    const EventSource = jest.fn()
    EventSource.CONNECTING = 0
    EventSource.CLOSED = 2

    Object.defineProperties(window, {
      localStorage: {
        value: localStorage
      },
      EventSource: {
        value: EventSource
      }
    })

    Object.defineProperty(location, 'pathname', { value: '/CHANNEL' })

    console.log = consoleLog = jest.fn()

    wrapper = shallow(<App />)
  })

  describe('render', () => {
    it('renders the blank page', () => {
      expect(wrapper.containsMatchingElement(<Blank />)).toBeTruthy()
    })

    it('renders a list of logs', () => {
      wrapper.setState({ log: [issuesOpened] })
      expect(wrapper.find('ListItem').exists()).toBeTruthy()
    })

    it('respects the filter', () => {
      wrapper.setState({ log: [issuesOpened, issuesOpenedTwo], filter: 'repository.name:probot' })
      expect(wrapper.find('ListItem').length).toBe(1)
    })

    it('respects the filter if it starts with body', () => {
      wrapper.setState({ log: [issuesOpened, issuesOpenedTwo], filter: 'body.repository.name:probot' })
      expect(wrapper.find('ListItem').length).toBe(1)
    })

    it('only filters correct get-value syntax (with :)', () => {
      wrapper.setState({ log: [issuesOpened, issuesOpenedTwo], filter: 'hello' })
      expect(wrapper.find('ListItem').length).toBe(2)
    })

    it('updates the App state when the filter input changes', () => {
      wrapper.setState({ log: [issuesOpened, issuesOpenedTwo] })
      const input = wrapper.find('input#search')
      input.simulate('change', { target: { value: 'hello' } })
      expect(wrapper.state('filter')).toBe('hello')
    })
  })

  describe('onopen', () => {
    it('sets the connection state to true', () => {
      wrapper.instance().onopen()
      expect(wrapper.state('connection')).toBeTruthy()
    })
  })

  describe('onerror', () => {
    it('sets the connection state to false', () => {
      wrapper.instance().onerror()
      expect(wrapper.state('connection')).toBeFalsy()
    })

    it('logs to the console when the state changes to connecting', () => {
      wrapper.instance().events.readyState = 0 // CONNECTING

      wrapper.instance().onerror('error')
      expect(consoleLog).toHaveBeenCalledWith('Reconnecting...', 'error')
    })

    it('logs to the console when the state changes to closed', () => {
      wrapper.instance().events.readyState = 2 // CLOSED

      wrapper.instance().onerror('error')
      expect(consoleLog.mock.calls[1]).toEqual(['Reinitializing...', 'error'])
    })
  })

  describe('onmessage', () => {
    it('adds the new log to the state and localStorage', () => {
      const item = { 'x-github-delivery': 123 }
      const message = { data: JSON.stringify(item) }
      wrapper.instance().onmessage(message)

      expect(wrapper.state('log')).toEqual([item])
      expect(localStorage.setItem.mock.calls[0][0]).toBe('smee:log:CHANNEL')
      expect(localStorage.setItem.mock.calls[0][1]).toMatchSnapshot()
    })

    it('does not add duplicates to the log array or localStorage', () => {
      const item = { 'x-github-delivery': 123 }
      const message = { data: JSON.stringify(item) }
      wrapper.setState({ log: [item] })
      wrapper.instance().onmessage(message)

      expect(wrapper.state('log').length).toBe(1)
      expect(localStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    beforeEach(() => {
      window.confirm = jest.fn(() => true)
      const item = { 'x-github-delivery': 123 }
      wrapper.setState({ log: [item] })
    })

    it('clears the log state and localStorage', () => {
      wrapper.instance().clear()
      expect(wrapper.state('log')).toEqual([])
      expect(localStorage.removeItem).toHaveBeenCalled()
    })

    it('does not clear pinned deliveries', () => {
      wrapper.instance().togglePinned(123)
      wrapper.instance().clear()
      expect(wrapper.state('log')).toMatchSnapshot()
      expect(localStorage.setItem.mock.calls[0][1]).toMatchSnapshot()
    })
  })

  describe('togglePinned', () => {
    it('adds a pinned item to the array', () => {
      wrapper.instance().togglePinned(123)
      expect(wrapper.state('pinnedDeliveries')).toEqual([123])
    })

    it('removes a pinned item from the array', () => {
      wrapper.setState({ pinnedDeliveries: [123] })
      wrapper.instance().togglePinned(123)
      expect(wrapper.state('pinnedDeliveries')).toEqual([])
    })

    it('stores the pinnedDeliveries in localStorage', () => {
      wrapper.instance().togglePinned(123)
      expect(localStorage.setItem.mock.calls[0][0]).toBe('smee:log:CHANNEL:pinned')
      expect(localStorage.setItem.mock.calls[0][1]).toMatchSnapshot()

      wrapper.instance().togglePinned(123)
      expect(localStorage.setItem.mock.calls[1][0]).toBe('smee:log:CHANNEL:pinned')
      expect(localStorage.setItem.mock.calls[1][1]).toMatchSnapshot()
    })
  })
})
