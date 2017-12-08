import React, { Component } from 'react'
import { string, object, number } from 'prop-types'
import moment from 'moment'

export default class EventDescription extends Component {
  static propTypes = {
    event: string.isRequired,
    payload: object.isRequired,
    timestamp: number.isRequired
  }

  render () {
    const { event, payload, timestamp } = this.props

    const formattedTime = moment(timestamp).format('dddd, MMMM Do YYYY, h:mm:ss a')
    const onARepo = payload.repository && payload.repository.full_name
    const onRepos = payload.repositories && payload.repositories.every(r => r.full_name)

    return (
      <div className="text-gray">
        <p className="mb-0">There was a <strong>{event}</strong> event received on <code>{formattedTime}</code>.</p>
        {onARepo && <p className="mt-0">This event was sent by <strong>{payload.repository.full_name}</strong>.</p>}
        {onRepos && <p className="mt-0">This event was triggered against: {payload.repositories.map(r => <span>{r.full_name}</span>)}.</p>}
      </div>
    )
  }
}
