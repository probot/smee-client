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
    it('returns the proper HTML', async () => {
      const res = await request(server).get('/')
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })
  })

  describe('GET /new', () => {
    it('redirects from /new to /TOKEN', async () => {
      const res = await request(server).get('/new')
      expect(res.status).toBe(307)
      expect(res.headers.location).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/[\w-]+$/)
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
    it('emits events', async (done) => {
      const payload = {payload: true}

      await request(server).post(channel)
        .set('X-Foo', 'bar')
        .send(payload)
        .expect(200)

      events.addEventListener('message', (msg) => {
        const data = JSON.parse(msg.data)
        expect(data.body).toEqual(payload)
        expect(data['x-foo']).toEqual('bar')

        // test is done if all of this gets called
        done()
      })
    })

    it('POST /:channel/redeliver re-emits a payload', async (done) => {
      const payload = {payload: true}

      await request(server).post(channel + '/redeliver')
        .send(payload)
        .expect(200)

      events.addEventListener('message', (msg) => {
        const data = JSON.parse(msg.data)
        expect(data).toEqual(payload)

        // test is done if all of this gets called
        done()
      })
    })
  })
})
