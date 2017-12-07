const createServer = require('../lib/server')
const request = require('supertest')

describe('server', () => {
  let server

  beforeEach(() => {
    server = createServer()
  })

  it('redirects from / to /TOKEN', async () => {
    
  })
})
