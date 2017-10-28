import React, { Component } from 'react'
import {
  RepoPushIcon,
  PackageIcon,
  GitPullRequestIcon
} from 'react-octicons'

const iconMap = {
  push: <RepoPushIcon />,
  pull_request: <GitPullRequestIcon />
}

export default class ListItem extends Component {
  render () {
    const { event } = this.props.item
    return (
      <li>
        <span className="p-1 input-monospace">{iconMap[event] || <PackageIcon />} {event}</span>
      </li>
    )
  }
}
