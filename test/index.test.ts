import Client from "../index"
import { describe, test, expect } from "vitest"

describe('client', () => {
  describe('createChannel', () => {
    test('returns a new channel', async () => {
      const channel = await Client.createChannel()
      expect(channel).toMatch(/https:\/\/smee\.io\/[0-9a-zA-Z]{10,}/)
    })

    test('throws if could not create a new channel', async () => {
      expect(Client.createChannel({
        // @ts-ignore
        fetch: async () => {
          return {
            headers: {
              get: () => null
            }
          }
        }
      })).rejects.toThrow('Failed to create channel')
    })
  })
})
