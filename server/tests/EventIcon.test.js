import React from 'react'
import EventIcon from '../src/components/EventIcon'
import { shallow } from 'enzyme'

describe('<EventIcon />', () => {
  describe('render', () => {
    it('should render the correct octicon', () => {
      const wrapper = shallow(<EventIcon event="ping" />)
      expect(wrapper.find('GlobeIcon').length).toBe(1)
    })

    it('renders the correct octicon if there an action', () => {
      const wrapper = shallow(<EventIcon event="issues" action="opened" />)
      expect(wrapper.find('IssueOpenedIcon').length).toBe(1)
    })

    it('renders the package octicon if the event is unknown', () => {
      const wrapper = shallow(<EventIcon event="nothing" />)
      expect(wrapper.find('PackageIcon').length).toBe(1)
    })
  })
})
