import Client = require('..')
import nock = require('nock')

describe('client', () => {
  describe('createChannel', () => {
    test('returns a new channel', async () => {
      const req = nock('https://smee.io').head('/new').reply(302, '', {
        Location: 'https://smee.io/abc123'
      })

      const channel = await Client.createChannel()
      expect(channel).toEqual('https://smee.io/abc123')
      expect(req.isDone()).toBe(true)
    })
  }),
  describe('onmessage', () => {
    test('forwards host header correctly', () => {
      const scope = nock('https://example.com')
          .matchHeader('host', 'example.com')
          .post('/target-path')
          .reply(201, '')

      const logger = {info: (msg: any) => {}}

      const client = new Client({
        source: 'https://smee.io/example',
        target: 'https://example.com/target-path',
        logger: <Console>logger
      });

      client.onmessage({data:'{}'})

      expect(scope.isDone()).toBe(true)
    })
  })
})
