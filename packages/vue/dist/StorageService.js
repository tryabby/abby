'use strict';

var core = require('@tryabby/core');
var Cookie = require('js-cookie');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Cookie__default = /*#__PURE__*/_interopDefault(Cookie);

// src/StorageService.ts
var DEFAULT_COOKIE_AGE = 365;
var ABStorageService = class {
  get(projectId, testName) {
    const retrievedValue = Cookie__default.default.get(core.getABStorageKey(projectId, testName));
    if (!retrievedValue)
      return null;
    return retrievedValue;
  }
  set(projectId, testName, value, options) {
    Cookie__default.default.set(core.getABStorageKey(projectId, testName), value, {
      expires: (options == null ? void 0 : options.expiresInDays) ? options.expiresInDays : DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, testName) {
    Cookie__default.default.remove(core.getABStorageKey(projectId, testName));
  }
};
var FFStorageService = class {
  get(projectId, flagName) {
    const retrievedValue = Cookie__default.default.get(core.getFFStorageKey(projectId, flagName));
    if (!retrievedValue)
      return null;
    return retrievedValue;
  }
  set(projectId, flagName, value) {
    Cookie__default.default.set(core.getFFStorageKey(projectId, flagName), value, {
      expires: DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, flagName) {
    Cookie__default.default.remove(core.getFFStorageKey(projectId, flagName));
  }
};
var RCStorageService = class {
  get(projectId, key) {
    const retrievedValue = Cookie__default.default.get(core.getRCStorageKey(projectId, key));
    return retrievedValue != null ? retrievedValue : null;
  }
  set(projectId, key, value) {
    Cookie__default.default.set(core.getRCStorageKey(projectId, key), value, {
      expires: DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, key) {
    Cookie__default.default.remove(core.getRCStorageKey(projectId, key));
  }
};
var TestStorageService = new ABStorageService();
var FlagStorageService = new FFStorageService();
var RemoteConfigStorageService = new RCStorageService();

exports.FlagStorageService = FlagStorageService;
exports.RemoteConfigStorageService = RemoteConfigStorageService;
exports.TestStorageService = TestStorageService;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=StorageService.js.map