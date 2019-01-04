import React from 'react'
import Blank from '../src/components/Blank'
import { shallow } from 'enzyme'

describe('<Blank />', () => {
  beforeEach(() => {
    Object.defineProperties(window, {
      location: {
        value: {
          href: 'https:/smee.io/CHANNEL'
        }
      }
    })
  })

  describe('render', () => {
    it('renders the blank page', () => {
      expect(<Blank />).toMatchSnapshot()
    })

    it('selects the input text when focused', () => {
      const spy = jest.fn()
      const wrapper = shallow(<Blank />)

      wrapper.find('input').simulate('focus', { target: { select: spy } })
      expect(spy).toHaveBeenCalled()
    })
  })
})
