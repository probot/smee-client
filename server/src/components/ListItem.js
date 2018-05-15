import React, { Component } from 'react'
import { object, bool, func } from 'prop-types'
import moment from 'moment'
import ReactJson from 'react-json-view'
import EventIcon from './EventIcon'
import { KebabHorizontalIcon, ClippyIcon, SyncIcon, PinIcon } from 'react-octicons'
import EventDescription from './EventDescription'
import copy from 'copy-to-clipboard'

export default class ListItem extends Component {
  static propTypes = {
    item: object.isRequired,
    pinned: bool.isRequired,
    togglePinned: func.isRequired,
    last: bool.isRequired
  }

  constructor (props) {
    super(props)
    this.toggleExpanded = () => this.setState({ expanded: !this.state.expanded })
    this.copy = this.copy.bind(this)
    this.redeliver = this.redeliver.bind(this)
    this.state = { expanded: false, copied: false, redelivered: false }
  }

  copy () {
    const copied = copy(JSON.stringify(this.props.item))
    this.setState({ copied })
  }

  redeliver () {
    return window.fetch(`${window.location.pathname}/redeliver`, {
      method: 'POST',
      body: JSON.stringify(this.props.item),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      this.setState({ redelivered: res.status === 200 })
    })
  }

  render () {
    const { expanded, copied, redelivered } = this.state
    const { item, last, pinned, togglePinned } = this.props

    const event = item['x-github-event']
    const payload = item.body
    const id = item['x-github-delivery']

    return (
      <li className={`p-3 ${last ? '' : 'border-bottom'}`}>
        <div className="d-flex flex-items-center">
          <div className="mr-2" style={{ width: 16 }}>
            <EventIcon event={event} action={payload.action} />
          </div>
          <span className="input-monospace">{event}</span>
          <time className="f6" style={{ marginLeft: 'auto' }}>{moment(item.timestamp).fromNow()}</time>
          <button onClick={this.toggleExpanded} className="ellipsis-expander ml-2"><KebabHorizontalIcon height={12} /></button>
        </div>

        {expanded && (
          <div className="mt-3">
            <div className="d-flex flex-justify-between flex-items-start">
              <div>
                <p><strong>Event ID:</strong> <code>{id}</code></p>
                <EventDescription event={event} payload={payload} timestamp={item.timestamp} />
              </div>

              <div>
                <button
                  onClick={() => togglePinned(id)}
                  className={`btn btn-sm tooltipped tooltipped-s ${pinned && 'text-blue'}`}
                  aria-label="Pin this delivery"
                ><PinIcon /></button>
                <button
                  onBlur={() => this.setState({ copied: false })}
                  onClick={this.copy}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-copy-btn"
                  aria-label={copied ? 'Copied!' : 'Copy payload to clipboard'}
                ><ClippyIcon /></button>
                <button
                  onBlur={() => this.setState({ redelivered: false })}
                  onClick={this.redeliver}
                  className="ml-2 btn btn-sm tooltipped tooltipped-s js-redeliver-btn"
                  aria-label={redelivered ? 'Sent!' : 'Redeliver this payload'}
                ><SyncIcon /></button>
              </div>
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
