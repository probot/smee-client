import React from 'react'
import ListItem from '../src/components/ListItem'
import { shallow } from 'enzyme'

describe('<ListItem />', () => {
  let item, el, togglePinned

  beforeEach(() => {
    item = {
      'x-github-event': 'issues',
      timestamp: 1513148474751,
      body: { action: 'opened' }
    }

    togglePinned = jest.fn()

    el = shallow(<ListItem last item={item} pinned={false} togglePinned={togglePinned} />)
  })

  describe('redeliver', () => {
    it('sets the redelivered state to true', async () => {
      const fetch = jest.fn(() => Promise.resolve({ status: 200 }))
      Object.defineProperty(window, 'fetch', { value: fetch, writable: true })

      await el.instance().redeliver()
      expect(fetch).toHaveBeenCalled()
      expect(el.state('redelivered')).toBeTruthy()
    })
  })

  describe('render', () => {
    it('should render with one child', () => {
      expect(el.children().length).toBe(1)
    })

    it('should render the expanded markup', () => {
      expect(el.children().length).toBe(1)

      el.find('button.ellipsis-expander').simulate('click')
      expect(el.children().length).toBe(2)
    })
  })

  describe('copy', () => {
    beforeEach(() => {
      el.find('button.ellipsis-expander').simulate('click')
    })

    it('changes the button\'s label onClick, then onBlur', async () => {
      let btn = el.find('.js-copy-btn')
      expect(el.state('copied')).toBeFalsy()
      expect(btn.prop('aria-label')).toBe('Copy payload to clipboard')

      el.setState({ copied: true })
      btn = el.find('.js-copy-btn')
      expect(btn.prop('aria-label')).toBe('Copied!')

      btn.simulate('focus')
      btn.simulate('blur')
      expect(el.state('copied')).toBeFalsy()
      btn = el.find('.js-copy-btn')
      expect(btn.prop('aria-label')).toBe('Copy payload to clipboard')
    })
  })

  describe('redeliver', () => {
    beforeEach(() => {
      el.find('button.ellipsis-expander').simulate('click')
    })

    it('changes the button\'s label onClick, then onBlur', async () => {
      let btn = el.find('.js-redeliver-btn')
      expect(el.state('redelivered')).toBeFalsy()
      expect(btn.prop('aria-label')).toBe('Redeliver this payload')

      el.setState({ redelivered: true })
      btn = el.find('.js-redeliver-btn')
      expect(btn.prop('aria-label')).toBe('Sent!')

      btn.simulate('focus')
      btn.simulate('blur')
      expect(el.state('redelivered')).toBeFalsy()
      btn = el.find('.js-redeliver-btn')
      expect(btn.prop('aria-label')).toBe('Redeliver this payload')
    })
  })
})
