import React from 'react'
import EventDescription from '../src/components/EventDescription'
import { shallow } from 'enzyme'
import moment from 'moment-timezone'

describe('<EventDescription />', () => {
  let props

  beforeEach(() => {
    moment.tz.setDefault('UTC')
    props = {
      event: 'issues',
      timestamp: 1513148474751,
      payload: { action: 'opened' }
    }
  })

  describe('render', () => {
    it('renders the correct description', () => {
      const wrapper = shallow(<EventDescription {...props} />)
      expect(wrapper.find('p').text()).toBe('There was a issues event received on Wednesday, December 13th 2017, 7:01:14 am.')
    })

    it('renders the correct description when on one repo', () => {
      const payload = { repository: { full_name: 'probot/probot' } }
      const wrapper = shallow(<EventDescription {...props} payload={payload} />)
      expect(wrapper.children().length).toBe(2)
      expect(wrapper.childAt(1).text()).toBe('This event was sent by probot/probot.')
    })

    it('renders the correct description when on multiple repos', () => {
      const payload = { repositories: [
        { full_name: 'probot/probot' },
        { full_name: 'JasonEtco/pizza' }
      ] }
      const wrapper = shallow(<EventDescription {...props} payload={payload} />)
      expect(wrapper.children().length).toBe(2)
      expect(wrapper.childAt(1).text()).toBe('This event was triggered against: probot/probotJasonEtco/pizza.')
    })
  })
})
