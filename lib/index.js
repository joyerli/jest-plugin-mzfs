const path = require('path');
const os = require('os');
// eslint-disable-next-line import/no-extraneous-dependencies
const { fs: mfs, vol } = require('memfs');

const fs = jest.requireActual('mz/fs');
const isWindows = os.platform() === 'win32';
const root = isWindows ? process.cwd().split(path.sep)[0] : '/';

/**
 * 为了支持内嵌
 * @param {*} absolutePath 基础
 * @param {*} object 文件对象
 */
const flatten = (absolutePath, object) => {
  const accumulate = (all, [currentPath, value]) => {
    const joinedPath = path.join(absolutePath, currentPath);
    const fullPath = path.isAbsolute(currentPath) ? currentPath : joinedPath;

    if (typeof value === 'string') {
      return {
        ...all, [fullPath]: value,
      };
    }
    if (!Object.keys(value).length) {
      return { ...all, [fullPath]: value };
    }
    return { ...all, ...flatten(fullPath, value) };
  };

  return Object.entries(object).reduce(accumulate, {});
};

/**
 * 读取实际文件内容
 * @param {*} filename
 */
const read = filename => fs.readFileSync(filename, 'utf8');

/**
 * 当前模拟的文件列表
 */
const getFiles = () => vol.toJSON();

/**
 * mock文件
 * @param {*} filesystem
 * @param {*} fsRoot
 */
const mock = (filesystem = {}, fsRoot = root) => {
  vol.fromJSON(flatten(fsRoot, filesystem), fsRoot);
  fs.__root = fsRoot;
};

/**
 * 从操作系统的文件系统中将文件加载到虚拟文件系统中
 * @param {*} files
 * @param {*} fsRoot
 */
const picker = (files = [], fsRoot = root) => {
  const readAll = (all, file) => ({ ...all, [file]: read(file) });
  const filesystem = files.reduce(readAll, {});

  mock(filesystem, fsRoot);
};

/**
 * 获取调用堆栈
 */
const trace = () => {
  const stacks = new Error().stack;
  const stacksArr = stacks.split('\n');
  return [stacksArr[3], stacksArr];
};

/**
 * 重置虚拟文件系统
 */
const restore = () => vol.reset();

/**
 * 不在node_modules中调用者判断
 * @param {*} caller
 */
const notModulesTest = caller => !caller.includes('node_modules');

fs.__getFiles = getFiles;
fs.__mock = mock;
fs.__picker = picker;
fs.__test = notModulesTest;
fs.__unmock = () => {
  restore();
  fs.__method = null;
};

const proxyFs = new Proxy(fs, {
  get(target, _prop) {
    let prop = _prop;
    if ([
      '__test', '__method',
      '__getFiles', '__mock',
      '__picker', '__unmock',
      '__root',
    ].includes(prop)) {
      return target[prop];
    }

    const isMock = prop.includes('Mock');

    if (!isMock
      && (!target.__method
        || !target.__method.length
        || !target.__method.includes(prop))) {
      return target[prop];
    }
    const caller = trace();
    if (!isMock && target.__test && !target.__test(...caller)) {
      return target[prop];
    }

    if (isMock) {
      prop = prop.slice(0, -4);
    }

    if (prop.includes('Sync')) {
      return mfs[prop];
    }
    return (...args) => new Promise((resolve, reject) => {
      mfs[prop](...args, (error, ...result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(...result);
      });
    });
  },
});

module.exports = proxyFs;
