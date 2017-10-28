import React, { Component } from 'react'
import { object, bool } from 'prop-types'
import moment from 'moment'
import {
  RepoPushIcon,
  PackageIcon,
  GitPullRequestIcon,
  BookmarkIcon,
  IssueOpenedIcon
} from 'react-octicons'

const iconMap = {
  push: <RepoPushIcon />,
  pull_request: <GitPullRequestIcon />,
  label: <BookmarkIcon />,
  issue: <IssueOpenedIcon />
}

export default class ListItem extends Component {
  static propTypes = {
    item: object.isRequired,
    last: bool.isRequired
  }

  render () {
    const { item, last } = this.props
    const { event, timestamp } = item
    return (
      <li className={`p-4 d-flex flex-items-center ${last ? '' : 'border-bottom'}`}>
        <div className="mr-2" style={{ width: 16 }}>
          {iconMap[event] || <PackageIcon />}
        </div>
        <span className="input-monospace">{event}</span>
        <time className="f6" style={{ marginLeft: 'auto' }}>{moment(timestamp).fromNow()}</time>
      </li>
    )
  }
}
