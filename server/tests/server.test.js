const nock = require('nock')
const createServer = require('../server')
const request = require('supertest')
const EventSource = require('eventsource')
const cookieSession = require('cookie-session')
const Keygrip = require('keygrip')

describe('server', () => {
  let app, server, events, url, channel

  beforeEach((done) => {
    channel = '/fake-channel'
    app = createServer()
    app.use(cookieSession({
      name: 'session',
      keys: ['key1'],
      secret: process.env.WEBHOOK_SECRET,
      maxAge: 30 * 24 * 60 * 60 * 1000
    }))
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
    it('returns the proper HTML when unauthenticated', async () => {
      const res = await request(server).get('/')
      expect(res.status).toBe(200)
    })

    it('returns the proper HTML when authenticated', async () => {
      let cookie = Buffer.from(JSON.stringify({'user': 'test', 'token': 'test'})).toString('base64')
      let kg = Keygrip(['key1'])
      let hash = kg.sign('session=' + cookie)
      const res = await request(server).get('/')
        .set('cookie', ['session=' + cookie + '; ' + 'session.sig=' + hash + ';'])
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })
  })

  describe('GET /logout', () => {
    it('logout the user', async () => {
      const res = await request(server).get('/logout')
      expect(res.redirect).toBe(true)
    })
  })

  describe('GET /new', () => {
    // setting cookie
    it('redirects to channel if authenticated', async () => {
      let cookie = Buffer.from(JSON.stringify({'user': 'test', 'token': 'test'})).toString('base64')
      let kg = Keygrip(['key1'])
      let hash = kg.sign('session=' + cookie)
      const res = await request(server).get('/new')
        .set('cookie', ['session=' + cookie + '; ' + 'session.sig=' + hash + ';'])
      expect(res.status).toBe(302)
    })

    it('redirects to github', async () => {
      await request(server).get('/new')
        .expect(302)
        .expect('Location', /^https:\/\/github.com\/login\/oauth\/authorize/)
    })
  })

  describe('GET /auth/github/callback', () => {
    it('redirects from github', async () => {
      nock('https://github.com').post('/login/oauth/access_token')
        .reply(200, { access_token: 'test', token_type: 'bearer' })
      await request(server).get('/auth/github/callback')
        .expect(302)
    })
  })

  describe('GET /:channel', () => {
    it('returns the proper HTML when unauthenticated', async () => {
      const res = await request(server).get(channel)
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })

    it('checks user authentication and redirects', async () => {
      let cookie = Buffer.from(JSON.stringify({'user': 'test', 'token': 'test'})).toString('base64')
      let kg = Keygrip(['key1'])
      let hash = kg.sign('session=' + cookie)
      const res = await request(server).get(channel)
                  .set('cookie', ['session=' + cookie + '; ' + 'session.sig=' + hash + ';'])
      expect(res.status).toBe(307)
      expect(res.redirect).toBe(true)
    })
  })

  describe('GET /:user/:channel', () => {
    it('session not set', async () => {
      const res = await request(server).get('/fake' + channel)
      expect(res.redirect).toBe(true)
    })

    it(' wrong user ', async () => {
      let cookie = Buffer.from(JSON.stringify({'user': 'test', 'token': 'test'})).toString('base64')
      let kg = Keygrip(['key1'])
      let hash = kg.sign('session=' + cookie)
      const res = await request(server).get('/fake' + channel)
        .set('cookie', ['session=' + cookie + '; ' + 'session.sig=' + hash + ';'])
      expect(res.status).toBe(200)
      expect(res.text).toMatchSnapshot()
    })

    it(' same user ', async (done) => {
      let cookie = Buffer.from(JSON.stringify({'user': 'fake', 'token': 'test'})).toString('base64')
      let kg = Keygrip(['key1'])
      let hash = kg.sign('session=' + cookie)
      const newChannel = '/fake-user/fake-channel'
      const newServer = app.listen(0, () => {
        url = `http://127.0.0.1:${server.address().port}${newChannel}`

        // Wait for event source to be ready
        events = new EventSource(url)
        events.addEventListener('ready', () => done())
      })

      const res = await request(newServer).get('/fake' + channel)
        .set('cookie', ['session=' + cookie + '; ' + 'session.sig=' + hash + ';'])
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
        done()
      })
    })

    it('POST /:channel/redeliver re-emits a payload', async () => {
      const payload = {payload: true}

      await request(server).post(channel + '/redeliver')
        .send(payload)
        .expect(200)

      events.addEventListener('message', (msg) => {
        const data = JSON.parse(msg.data)
        expect(data).toEqual(payload)
      })
    })

    it('emits events for authenticated', async (done) => {
      const payload = {payload: true}
      const newChannel = '/fake-user/fake-channel'
      const newServer = app.listen(0, () => {
        url = `http://127.0.0.1:${server.address().port}${newChannel}`

        // Wait for event source to be ready
        events = new EventSource(url)
        events.addEventListener('ready', () => done())
      })
      await request(newServer).post('/fake-user' + channel)
        .set('X-Foo', 'bar')
        .send(payload)
        .expect(200)

      events.addEventListener('message', (msg) => {
        const data = JSON.parse(msg.data)
        expect(data.body).toEqual(payload)
        expect(data['x-foo']).toEqual('bar')
        done()
        // test is done if all of this gets calle
      })
    })

    it('POST /:user/:channel/redeliver re-emits a payload', async (done) => {
      const payload = {payload: true}
      const newChannel = '/fake-user/fake-channel'
      const newServer = app.listen(0, () => {
        url = `http://127.0.0.1:${server.address().port}${newChannel}`

        // Wait for event source to be ready
        events = new EventSource(url)
        events.addEventListener('ready', () => done())
      })
      await request(newServer).post(newChannel + '/redeliver')
        .send(payload)
        .expect(200)

      events.addEventListener('message', (msg) => {
        const data = JSON.parse(msg.data)
        expect(data).toEqual(payload)
        done()
      })
    })
  })
})
