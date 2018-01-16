import React, { Component } from 'react'
import { InfoIcon } from 'react-octicons'
import hljs from 'highlight.js'

export default class Blank extends Component {
  render () {
    const code = `const SmeeClient = require('smee-client')

const smee = new SmeeClient({
  source: '${window.location.href}',
  target: 'http://localhost:3000/events',
  logger: console
})

const events = smee.start()

// Stop forwarding events
events.close()`

    return (
      <div className="container-md p-responsive">
        <div className="Box p-3 mt-4">
          <div className="d-flex flex-items-center mb-2">
            <label htmlFor="url">Webhook Proxy URL</label>
            <span className="ml-2 tooltipped tooltipped-n text-gray-light" aria-label="Tell your service of choice to send webhook payloads to this URL."><InfoIcon /></span>
          </div>
          <input
            type="text"
            id="url"
            autoFocus
            onFocus={e => e.target.select()}
            readOnly
            value={window.location.href}
            className="form-control input-xl input-block"
          />
          <p className="mt-2 text-gray-light f6">This page will automatically update as things happen.</p>

          <hr />
          <div className="mt-4 markdown-body">
            <h3>Use the CLI</h3>
            <p>The <code>smee</code> command will forward webhooks from smee.io to your local development environment.</p>
            <pre><code>
              $ smee -s {window.location.href}
            </code></pre>
            <h3>Use the Node.js client</h3>
            <pre className="js" dangerouslySetInnerHTML={{ __html: hljs.highlight('javascript', code).value }} />
          </div>
        </div>
      </div>
    )
  }
}
