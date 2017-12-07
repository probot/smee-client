const createServer = require('../lib/server')
const request = require('supertest')

describe('server', () => {
  let server

  beforeEach(() => {
    server = createServer()
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
      const res = await request(server).get('/fake-channel')
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
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
