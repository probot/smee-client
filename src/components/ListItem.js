import React, { Component } from 'react'
import { object, bool } from 'prop-types'
import moment from 'moment'
import ReactJson from 'react-json-view'
import {
  RepoPushIcon,
  PackageIcon,
  GitPullRequestIcon,
  BookmarkIcon,
  IssueOpenedIcon,
  KebabHorizontalIcon
} from 'react-octicons'
import EventDescription from './EventDescription'

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

  constructor (props) {
    super(props)
    this.toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
    this.state = { expanded: false }
  }

  render () {
    const { expanded } = this.state
    const { item, last } = this.props
    const { event, timestamp, payload, id } = item
    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className="d-flex flex-items-center">
          <div className="mr-2" style={{ width: 16 }}>
            {iconMap[event] || <PackageIcon />}
          </div>
          <span className="input-monospace">{event}</span>
          <time className="f6" style={{ marginLeft: 'auto' }}>{moment(timestamp).fromNow()}</time>
          <button onClick={this.toggleExpanded} className="ellipsis-expander ml-2"><KebabHorizontalIcon height={12} /></button>
        </div>

        {expanded && (
          <div className="mt-3">
            <div>
              <p><strong>Event ID:</strong> <code>{id}</code></p>
              <EventDescription event={event} item={item} />
            </div>
            <hr className="mt-3" />
            <div className="mt-3">
              <h5 className="mb-2">Payload</h5>
              <ReactJson
                src={payload}
                name={id}
                collapsed={1}
                displayObjectSize={false}
                displayDataTypes={false}
                enableClipboard={false}
              />
            </div>
          </div>
        )}
      </li>
    )
  }
}
