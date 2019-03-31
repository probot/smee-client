const Client = require('..')

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
  })
})
