const commander = require('commander')

describe('commander', () => {
  const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => { });

  afterEach(() => {
    writeSpy.mockClear();
  });

  test('when specify --help then exit', () => {
    // Arrange
    const program = new commander.Command();
    program.exitOverride();

    expect(() => {
      // Act
      program.parse(['node', 'test', '--help']);
    })
      // Assert
      .toThrow('(outputHelp)');
  });

  test('when specify -u -t', () => {
    // Arrange
    const program = new commander.Command();
    program
      .option('-u, --url <url>')
      .option('-t, --target <target>')
      .parse(['node', 'test', '-t', 'TARGET', '-u', 'URL'])

    // Act
    const options = program.opts()

    // Assert
    expect(options.target).toEqual('TARGET');
    expect(options.url).toEqual('URL');
  });
})


