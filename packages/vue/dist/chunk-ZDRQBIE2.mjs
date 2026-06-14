import { getABStorageKey, getFFStorageKey, getRCStorageKey } from '@tryabby/core';
import Cookie from 'js-cookie';

// src/StorageService.ts
var DEFAULT_COOKIE_AGE = 365;
var ABStorageService = class {
  get(projectId, testName) {
    const retrievedValue = Cookie.get(getABStorageKey(projectId, testName));
    if (!retrievedValue)
      return null;
    return retrievedValue;
  }
  set(projectId, testName, value, options) {
    Cookie.set(getABStorageKey(projectId, testName), value, {
      expires: (options == null ? void 0 : options.expiresInDays) ? options.expiresInDays : DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, testName) {
    Cookie.remove(getABStorageKey(projectId, testName));
  }
};
var FFStorageService = class {
  get(projectId, flagName) {
    const retrievedValue = Cookie.get(getFFStorageKey(projectId, flagName));
    if (!retrievedValue)
      return null;
    return retrievedValue;
  }
  set(projectId, flagName, value) {
    Cookie.set(getFFStorageKey(projectId, flagName), value, {
      expires: DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, flagName) {
    Cookie.remove(getFFStorageKey(projectId, flagName));
  }
};
var RCStorageService = class {
  get(projectId, key) {
    const retrievedValue = Cookie.get(getRCStorageKey(projectId, key));
    return retrievedValue != null ? retrievedValue : null;
  }
  set(projectId, key, value) {
    Cookie.set(getRCStorageKey(projectId, key), value, {
      expires: DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, key) {
    Cookie.remove(getRCStorageKey(projectId, key));
  }
};
var TestStorageService = new ABStorageService();
var FlagStorageService = new FFStorageService();
var RemoteConfigStorageService = new RCStorageService();

export { FlagStorageService, RemoteConfigStorageService, TestStorageService };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=chunk-ZDRQBIE2.mjs.map