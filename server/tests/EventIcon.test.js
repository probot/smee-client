import React from 'react'
import EventIcon from '../src/components/EventIcon'
import { shallow } from 'enzyme'
import { Globe, IssueOpened, Package } from '@githubprimer/octicons-react'

describe('<EventIcon />', () => {
  describe('render', () => {
    it('should render the correct octicon', () => {
      const wrapper = shallow(<EventIcon event="ping" />)
      expect(wrapper.find('Octicon').props().icon).toEqual(Globe)
    })

    it('renders the correct octicon if there an action', () => {
      const wrapper = shallow(<EventIcon event="issues" action="opened" />)
      expect(wrapper.find('Octicon').props().icon).toEqual(IssueOpened)
    })

    it('renders the package octicon if the event is unknown', () => {
      const wrapper = shallow(<EventIcon event="nothing" />)
      expect(wrapper.find('Octicon').props().icon).toEqual(Package)
    })
  })
})
