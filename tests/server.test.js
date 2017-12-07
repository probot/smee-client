const createServer = require('../lib/server')
const request = require('supertest')
const EventSource = require('eventsource')

describe('server', () => {
  let app, server, events, url, channel

  beforeEach((done) => {
    channel = '/fake-channel'
    app = createServer()

    server = app.listen(0, () => {
      url = `http://127.0.0.1:${server.address().port}${channel}`

      // Wait for event source to be ready
      events = new EventSource(url)
      events.addEventListener('ready', () => done())
    })
  })

  afterEach(() => {
    server && server.close()
    events && events.close()
  })

  describe('GET /', () => {
    it('redirects from / to /TOKEN', async () => {
      const res = await request(server).get('/')
      expect(res.status).toBe(302)
      expect(typeof res.headers.location).toBe('string')
    })
  })

  describe('GET /:channel', () => {
    it('returns the proper HTML', async () => {
      const res = await request(server).get(channel)
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })
  })

  describe('events', () => {
    it('emits events', async () => {
      const spy = jest.fn()

      events.addEventListener('message', (message) => {
        spy(message)
      })

      const res = await request(server).post(channel).send({ payload: true })
      expect(res.status).toBe(200)
      expect(spy).toHaveBeenCalled()
    })
  })

  it('POST /:channel/redeliver re-emits a payload', async () => {
    const payload = {
      foo: true,
      bar: false
    }

    const res = await request(server).post('/jason/redeliver').send(payload)
    expect(res.status).toBe(200)
  })
})
