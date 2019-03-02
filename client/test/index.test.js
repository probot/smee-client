const createServer = require('../../server/server')
const Client = require('..')
const request = require('supertest')
const nock = require('nock')

// Only allow requests to the proxy server listening on localhost
nock.enableNetConnect('127.0.0.1')

const logger = {
  info: jest.fn(),
  error: jest.fn()
}

describe('client', () => {
  let path, host, client, channel

  const targetUrl = 'http://example.com/foo/bar'

  beforeEach((done) => {
    path = createServer().listen(0, () => {
      host = `http://127.0.0.1:${path.address().port}`
      done()
    })
  })

  afterEach(() => {
    path && path.close()
    client && client.close()
  })

  describe('connecting to a channel', () => {
    beforeEach((done) => {
      channel = '/fake-channel'
      client = new Client({
        source: `${host}${channel}`,
        target: targetUrl,
        logger
      }).start()
      // Wait for event source to be ready
      client.addEventListener('ready', () => done())
    })

    test('throws an error if the source is invalid', async () => {
      try {
        client = new Client({
          source: 'not-a-real-url',
          target: targetUrl,
          logger
        }).start()
      } catch (e) {
        expect(e.message).toMatchSnapshot()
      }
    })

    test('POST /:channel forwards to target url', async (done) => {
      const payload = { payload: true }

      // Expect request to target
      const forward = nock('http://example.com').post('/foo/bar', payload).reply(200)

      // Test is done when this is called
      client.addEventListener('message', (msg) => {
        expect(forward.isDone()).toBe(true)
        done()
      })

      // Send request to proxy server
      await request(path).post(channel).send(payload).expect(200)
    })
  })

  describe('createChannel', () => {
    test('returns a new channel', async () => {
      const req = nock('https://smee.io').head('/new').reply(302, '', {
        Location: 'https://smee.io/abc123'
      })

      const channel = await Client.createChannel()
      expect(channel).toEqual('https://smee.io/abc123')
      expect(req.isDone()).toBe(true)
    })
  })

  describe('using proxy', () => {
    test('Creates event source if proxy is specified', async () => {
      channel = '/fake-channel'
      eventSource = client = new Client({
        source: `${host}${channel}`,
        target: targetUrl,
        proxy: 'hello:123@proxy.com',
        logger
      }).start()
      
      // Somehow check if eventsource has the proxy defined?
    })
  })
})
