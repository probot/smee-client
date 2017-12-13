import React from 'react'
import ListItem from '../src/components/ListItem'
import { shallow } from 'enzyme'

describe('<ListItem />', () => {
  let item

  beforeEach(() => {
    item = {
      'x-github-event': 'issues',
      timestamp: 1513148474751,
      body: { action: 'opened' }
    }
  })

  it('should render with one child', () => {
    const wrapper = shallow(<ListItem last item={item} />)
    expect(wrapper.children().length).toBe(1)
  })

  it('should render the expanded markup', () => {
    const wrapper = shallow(<ListItem last item={item} />)
    expect(wrapper.children().length).toBe(1)

    wrapper.find('button.ellipsis-expander').simulate('click')
    expect(wrapper.children().length).toBe(2)
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
