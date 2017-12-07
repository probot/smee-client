const createServer = require('../lib/server')
const request = require('supertest')

describe('server', () => {
  let server

  beforeEach(() => {
    server = createServer()
  })

  it('redirects from / to /TOKEN', async () => {
    const res = await request(server).get('/')
    expect(res.status).toBe(302)
    expect(typeof res.headers.location).toBe('string')
  })
})
