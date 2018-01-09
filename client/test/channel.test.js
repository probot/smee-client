const createServer = require('../..')
const Channel = require('../lib/channel')
const request = require('supertest')
const nock = require('nock')

// Only allow requests to the proxy server listening on localhost
nock.enableNetConnect('127.0.0.1')

const logger = {
  info: jest.fn(),
  error: jest.fn()
}

describe('client', () => {
  let proxyApp, proxyServer, sourceUrl, events

  const targetUrl = 'http://example.com/foo/bar'
  const channel = '/fake-channel'

  beforeEach((done) => {
    proxyApp = createServer()

    proxyServer = proxyApp.listen(0, () => {
      sourceUrl = `http://127.0.0.1:${proxyServer.address().port}${channel}`

      const client = new Channel({source: sourceUrl, target: targetUrl, logger})
      events = client.start()
      // Wait for event source to be ready
      events.addEventListener('ready', () => done())
    })
  })

  afterEach(() => {
    proxyServer && proxyServer.close()
    events && events.close()
  })

  it('POST /:channel forwards to target url', async (done) => {
    const payload = {payload: true}

    // Expect request to target
    const forward = nock('http://example.com').post('/foo/bar', payload).reply(200)

    // Test is done when this is called
    events.addEventListener('message', (msg) => {
      expect(forward.isDone()).toBe(true)
      done()
    })

    // Send request to proxy server
    await request(proxyServer).post(channel).send(payload).expect(200)
  })
})
