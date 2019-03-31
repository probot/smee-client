const Redis = require('ioredis')

module.exports = class Cache {
  constructor () {
    this.redis = new Redis(process.env.REDIS_URL || { host: 'localhost', port: 6379 })
  }

  async setForChannel (channel, id, payload) {
    const key = `${channel}:${id}`
    return this.redis.set(key, JSON.stringify(payload), 'ex', '10')
  }

  async getAllForChannel (channel) {
    return new Promise(async (resolve, reject) => {
      const keys = []

      // Create a readable stream (object mode)
      const stream = this.redis.scanStream({ match: `${channel}:*`, count: 100 })
      stream.on('data', (resultKeys) => {
        // `resultKeys` is an array of strings representing key names.
        keys.push(...resultKeys)
      })

      stream.on('end', async () => {
        const values = await Promise.all(keys.map(async key => JSON.parse(await this.redis.get(key))))
        return resolve(values)
      })

      stream.on('error', reject)
    })
  }
}
