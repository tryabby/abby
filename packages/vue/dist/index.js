"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  createAbby: () => createAbby,
  defineConfig: () => import_core3.defineConfig
});
module.exports = __toCommonJS(src_exports);

// src/createAbby.ts
var import_core2 = require("@tryabby/core");
var import_vue = require("vue");

// src/StorageService.ts
var import_core = require("@tryabby/core");
var import_js_cookie = __toESM(require("js-cookie"));
var DEFAULT_COOKIE_AGE = 365;
var ABStorageService = class {
  get(projectId, testName) {
    return import_js_cookie.default.get((0, import_core.getABStorageKey)(projectId, testName)) ?? null;
  }
  set(projectId, testName, value, options) {
    import_js_cookie.default.set((0, import_core.getABStorageKey)(projectId, testName), value, {
      expires: options?.expiresInDays ?? DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, testName) {
    import_js_cookie.default.remove((0, import_core.getABStorageKey)(projectId, testName));
  }
};
var FFStorageService = class {
  get(projectId, flagName) {
    return import_js_cookie.default.get((0, import_core.getFFStorageKey)(projectId, flagName)) ?? null;
  }
  set(projectId, flagName, value) {
    import_js_cookie.default.set((0, import_core.getFFStorageKey)(projectId, flagName), value, { expires: DEFAULT_COOKIE_AGE });
  }
  remove(projectId, flagName) {
    import_js_cookie.default.remove((0, import_core.getFFStorageKey)(projectId, flagName));
  }
};
var RCStorageService = class {
  get(projectId, key) {
    return import_js_cookie.default.get((0, import_core.getRCStorageKey)(projectId, key)) ?? null;
  }
  set(projectId, key, value) {
    import_js_cookie.default.set((0, import_core.getRCStorageKey)(projectId, key), value, { expires: DEFAULT_COOKIE_AGE });
  }
  remove(projectId, key) {
    import_js_cookie.default.remove((0, import_core.getRCStorageKey)(projectId, key));
  }
};
var TestStorageService = new ABStorageService();
var FlagStorageService = new FFStorageService();
var RemoteConfigStorageService = new RCStorageService();

// src/createAbby.ts
function createAbby(config) {
  const abby = new import_core2.Abby(
    config,
    {
      get: (key) => typeof window === "undefined" ? null : TestStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined" || config.cookies?.disableByDefault)
          return;
        TestStorageService.set(config.projectId, key, value, {
          expiresInDays: config.cookies?.expiresInDays
        });
      }
    },
    {
      get: (key) => typeof window === "undefined" ? null : FlagStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined")
          return;
        FlagStorageService.set(config.projectId, key, value);
      }
    },
    {
      get: (key) => typeof window === "undefined" ? null : RemoteConfigStorageService.get(config.projectId, key),
      set: (key, value) => {
        if (typeof window === "undefined")
          return;
        RemoteConfigStorageService.set(config.projectId, key, value);
      }
    }
  );
  const data = (0, import_vue.shallowRef)(abby.getProjectData());
  let loadPromise;
  const sync = (next) => {
    data.value = next;
  };
  abby.subscribe(sync);
  const ensureLoaded = () => {
    if (typeof window === "undefined")
      return;
    if (!loadPromise) {
      loadPromise = abby.loadProjectData().then((next) => {
        if (next)
          sync(next);
      });
    }
  };
  const useAbby = (name, lookupObject) => {
    ensureLoaded();
    const rawVariant = (0, import_vue.computed)(
      () => data.value.tests[name]?.selectedVariant ?? abby.getTestVariant(name)
    );
    const variant = (0, import_vue.computed)(() => {
      const selected = rawVariant.value;
      return lookupObject ? lookupObject[selected] : selected;
    });
    const onAct = () => {
      const selectedVariant = rawVariant.value;
      if (!selectedVariant)
        return;
      import_core2.HttpService.sendData({
        url: config.apiUrl,
        type: import_core2.AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant,
          testName: name
        }
      });
    };
    return { variant, onAct };
  };
  const useFeatureFlag = (name) => {
    ensureLoaded();
    return (0, import_vue.computed)(() => data.value.flags[name]?.value ?? abby.getFeatureFlag(name));
  };
  const useRemoteConfig = (name) => {
    ensureLoaded();
    return (0, import_vue.computed)(
      () => data.value.remoteConfig[name]?.value ?? abby.getRemoteConfig(name)
    );
  };
  return {
    useAbby,
    useFeatureFlag,
    useRemoteConfig,
    __abby__: abby
  };
}

// src/index.ts
var import_core3 = require("@tryabby/core");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createAbby,
  defineConfig
});
