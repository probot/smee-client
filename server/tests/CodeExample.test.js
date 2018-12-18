import React from 'react'
import CodeExample from '../src/components/CodeExample'
import { shallow } from 'enzyme'

describe('<CodeExample />', () => {
  describe('render', () => {
    it('renders the expected HTML', () => {
      const wrapper = shallow(<CodeExample />)
      expect(wrapper.render().text()).toMatchSnapshot()
    })
  })
})
