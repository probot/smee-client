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
  IssueClosedIcon,
  KebabHorizontalIcon,
  ClippyIcon
} from 'react-octicons'
import EventDescription from './EventDescription'
import copy from 'copy-to-clipboard'

const iconMap = {
  push: <RepoPushIcon />,
  pull_request: <GitPullRequestIcon />,
  label: <BookmarkIcon />,
  'issues.opened': <IssueOpenedIcon />,
  'issues.closed': <IssueClosedIcon />
}

export default class ListItem extends Component {
  static propTypes = {
    item: object.isRequired,
    last: bool.isRequired
  }

  constructor (props) {
    super(props)
    this.toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
    this.copy = () => {
      const copied = copy(JSON.stringify(this.props.item))
      this.setState({ copied })
    }
    this.state = { expanded: false, copied: false }
  }

  render () {
    const { expanded, copied } = this.state
    const { item, last } = this.props
    const { event, timestamp, payload, id } = item

    let icon

    if (payload.action && iconMap[`${event}.${payload.action}`]) {
      icon = iconMap[`${event}.${payload.action}`]
    } else if (iconMap[event]) {
      icon = iconMap[event]
    } else {
      icon = <PackageIcon />
    }

    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className="d-flex flex-items-center">
          <div className="mr-2" style={{ width: 16 }}>
            {icon}
          </div>
          <span className="input-monospace">{event}</span>
          <time className="f6" style={{ marginLeft: 'auto' }}>{moment(timestamp).fromNow()}</time>
          <button onClick={this.toggleExpanded} className="ellipsis-expander ml-2"><KebabHorizontalIcon height={12} /></button>
        </div>

        {expanded && (
          <div className="mt-3">
            <div className="d-flex flex-justify-between flex-items-start">
              <div>
                <p><strong>Event ID:</strong> <code>{id}</code></p>
                <EventDescription event={event} item={item} />
              </div>
              <button onBlur={() => this.setState({ copied: false })} className="btn btn-sm tooltipped tooltipped-s" aria-label={copied ? 'Copied!' : 'Copy payload to clipboard'} onClick={this.copy}><ClippyIcon /></button>
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
