const fs = require('mz/fs');

jest.mock('mz/fs', () => require('../index'));

describe('jest-plugin-fs插件', () => {
  beforeEach(() => {
    fs.__mock({}, '');
  });
  afterEach(() => {
    fs.__unmock();
  });
  it('__getFiles函数', async () => {
    fs.__method = ['mkdir', 'writeFile'];
    await fs.mkdir('/src');
    await fs.writeFile('/src/test.txt', '====', {
      encoding: 'utf8',
    });
    expect(fs.__getFiles()).toMatchSnapshot();
  });
  it('__mock', async () => {
    fs.__mock({
      'src/page1/hello.txt': '',
      'src/world.js': '',
    }, '/');
    fs.__method = ['readdir'];
    const result = await fs.readdir('/src');
    expect(result).toMatchSnapshot();
  });
  it('__picker', async () => {
    fs.__picker([__filename]);
    fs.__method = ['readdir'];
    const result = await fs.readdir(__dirname);
    expect(result).toMatchSnapshot();
  });
  it('__test', async () => {
    const spy = jest.fn();
    spy.mockReturnValue(true);
    fs.__method = ['readdir'];
    fs.__test = spy;
    await fs.readdir('/');
    const callStr = spy.mock.calls[0][0].replace(/\\\\/g, '/');
    expect(callStr.includes('__test__/test.spec.js')).toBe(true);
  });
  it('__method', async () => {
    const result1 = await fs.exists(__filename);
    expect(result1).toBe(true);
    fs.__method = ['exists'];
    const result2 = await fs.exists(__filename);
    expect(result2).toBeFalsy();
  });
  it('__mock支持使用{}创建文件夹', async () => {
    fs.__mock({
      'README.md': '你好',
      './dir': {},
    }, '/app');
    fs.__method = ['lstatSync'];
    expect(fs.lstatSync('/app/dir').isDirectory()).toBe(true);
  });
  it('支持Mock函数', async () => {
    const result1 = await fs.exists(__filename);
    expect(result1).toBe(true);
    const result2 = await fs.existsMock(__filename);
    expect(result2).toBeFalsy();
  });
});
