const path = require('path')

const Config = require('../lib/config')

describe('Config', () => {
  const cwd = process.cwd()

  afterEach(() => {
    process.chdir(cwd)
  })

  describe('load', () => {
    test('load config from a .smeerc YAML file', () => {
      process.chdir(path.join(__dirname, 'fixtures', 'yaml-config'))
      const config = Config.load()
      expect(config.host).toEqual('yaml')
    })

    test('load config from a .smeerc json file', () => {
      process.chdir(path.join(__dirname, 'fixtures', 'json-config'))
      const config = Config.load()
      expect(config.host).toEqual('json')
    })

    test('loads config from package.json', () => {
      process.chdir(path.join(__dirname, 'fixtures', 'package-config'))
      const config = Config.load()
      expect(config.host).toEqual('package.json')
    })
  })

  describe('host', () => {
    test('defaults to smee.io', () => {
      expect(new Config().host).toEqual('https://smee.io')
    })

    test('can be overrideen', () => {
      expect(new Config({host: 'https://example.com'}).host).toEqual('https://example.com')
    })
  })
})
