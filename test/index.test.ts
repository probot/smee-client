import Client from "../index"
import { describe, test, expect } from "vitest"

describe('client', () => {
  describe('createChannel', () => {
    test('returns a new channel', async () => {
      const channel = await Client.createChannel()
      expect(channel).toMatch(/https:\/\/smee\.io\/[0-9a-zA-Z]{10,}/)
    })
  })
})
