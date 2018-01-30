import React from 'react'
import App from '../src/components/App'
import Blank from '../src/components/Blank'
import { shallow } from 'enzyme'
import issuesOpened from './fixtures/issues.opened.json'

describe('<App />', () => {
  let localStorage, wrapper

  beforeEach(() => {
    localStorage = {
      getItem: jest.fn(),
      setItem: jest.fn()
    }

    Object.defineProperties(window, {
      localStorage: {
        value: localStorage
      },
      EventSource: {
        value: jest.fn()
      }
    })

    Object.defineProperty(location, 'pathname', { value: '/CHANNEL' })

    console.log = jest.fn()

    wrapper = shallow(<App />)
  })

  describe('render', () => {
    it('renders the blank page', () => {
      expect(wrapper.containsMatchingElement(<Blank />)).toBeTruthy()
    })

    it('renders a list of logs', () => {
      wrapper.setState({ log: [issuesOpened] })

      expect(wrapper.find('li').exists())
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
})
