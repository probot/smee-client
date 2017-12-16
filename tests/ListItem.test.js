import React from 'react'
import ListItem from '../src/components/ListItem'
import { shallow } from 'enzyme'

describe('<ListItem />', () => {
  let item, el

  beforeEach(() => {
    item = {
      'x-github-event': 'issues',
      timestamp: 1513148474751,
      body: { action: 'opened' }
    }

    el = shallow(<ListItem last item={item} />)
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

    it('renders the correct octicon if there is no action', () => {
      const i = { ...item, 'x-github-event': 'test' }
      const wrapper = shallow(<ListItem last item={i} />)
      expect(wrapper.find('PackageIcon').length).toBe(1)
    })

    it('renders the package octicon if the event is unknown', () => {
      const i = {
        'x-github-event': 'push',
        timestamp: 1513148474751,
        body: {}
      }
      const wrapper = shallow(<ListItem last item={i} />)
      expect(wrapper.find('RepoPushIcon').length).toBe(1)
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
