'use strict';

var core = require('@tryabby/core');
var vue = require('vue');
var Cookie = require('js-cookie');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Cookie__default = /*#__PURE__*/_interopDefault(Cookie);

// src/createAbby.ts
var DEFAULT_COOKIE_AGE = 365;
var ABStorageService = class {
  get(projectId, testName) {
    const retrievedValue = Cookie__default.default.get(core.getABStorageKey(projectId, testName));
    if (!retrievedValue)
      return null;
    return retrievedValue;
  }
  set(projectId, testName, value, options) {
    var _a;
    Cookie__default.default.set(core.getABStorageKey(projectId, testName), value, {
      expires: (_a = options == null ? void 0 : options.expiresInDays) != null ? _a : DEFAULT_COOKIE_AGE
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
    if (!retrievedValue)
      return null;
    return retrievedValue;
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

// src/createAbby.ts
var ABBY_INJECT_KEY = Symbol("abby");
function createAbby(abbyConfig) {
  const abby = new core.Abby(
    abbyConfig,
    {
      get: (key) => {
        if (typeof window === "undefined")
          return null;
        return TestStorageService.get(abbyConfig.projectId, key);
      },
      set: (key, value) => {
        var _a;
        if (typeof window === "undefined" || ((_a = config.cookies) == null ? void 0 : _a.disableByDefault))
          return;
        TestStorageService.set(abbyConfig.projectId, key, value);
      }
    },
    {
      get: (key) => {
        if (typeof window === "undefined")
          return null;
        return FlagStorageService.get(abbyConfig.projectId, key);
      },
      set: (key, value) => {
        if (typeof window === "undefined")
          return;
        FlagStorageService.set(abbyConfig.projectId, key, value);
      }
    },
    {
      get: (key) => {
        if (typeof window === "undefined")
          return null;
        return RemoteConfigStorageService.get(abbyConfig.projectId, key);
      },
      set: (key, value) => {
        if (typeof window === "undefined")
          return;
        RemoteConfigStorageService.set(abbyConfig.projectId, key, value);
      }
    }
  );
  const config = abbyConfig;
  const abbyDataRef = vue.shallowRef(abby.getProjectData());
  let isLoaderInitialized = false;
  const initGlobalLoader = () => {
    if (isLoaderInitialized)
      return;
    isLoaderInitialized = true;
    if (typeof window !== "undefined") {
      abby.loadProjectData().then((data) => {
        if (data) {
          abbyDataRef.value = data;
        }
      });
      abby.subscribe((data) => {
        abbyDataRef.value = data;
      });
    }
  };
  const useAbbyData = () => {
    const injected = vue.inject(ABBY_INJECT_KEY, null);
    if (!injected) {
      initGlobalLoader();
      return abbyDataRef;
    }
    return injected;
  };
  const useAbby = (name, lookupObject) => {
    const dataRef = useAbbyData();
    const selectedVariant = vue.computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = dataRef.value) == null ? void 0 : _a.tests[name]) == null ? void 0 : _b.selectedVariant) != null ? _c : "";
    });
    const notify = () => {
      const variant2 = selectedVariant.value;
      if (!name || !variant2)
        return;
      core.HttpService.sendData({
        url: config.apiUrl,
        type: core.AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: variant2,
          testName: name
        }
      });
    };
    vue.watch(
      selectedVariant,
      (newVariant, oldVariant) => {
        if (newVariant && newVariant !== oldVariant) {
          notify();
        }
      },
      { immediate: true }
    );
    const onAct = () => {
      const variant2 = selectedVariant.value;
      if (!variant2)
        return;
      core.HttpService.sendData({
        url: config.apiUrl,
        type: core.AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: variant2,
          testName: name
        }
      });
    };
    const variant = vue.computed(() => {
      const variantVal = selectedVariant.value;
      return lookupObject ? lookupObject[variantVal] : variantVal;
    });
    return {
      variant,
      onAct
    };
  };
  const useFeatureFlag = (name) => {
    const dataRef = useAbbyData();
    return vue.computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = dataRef.value) == null ? void 0 : _a.flags[name]) == null ? void 0 : _b.value) != null ? _c : false;
    });
  };
  const useFeatureFlags = () => {
    const dataRef = useAbbyData();
    return vue.computed(() => {
      var _a, _b;
      const flags = (_b = (_a = dataRef.value) == null ? void 0 : _a.flags) != null ? _b : {};
      return Object.keys(flags).map((flagName) => ({
        name: flagName,
        value: flags[flagName].value
      }));
    });
  };
  const useRemoteConfigVariables = () => {
    const dataRef = useAbbyData();
    return vue.computed(() => {
      var _a, _b;
      const remoteConfig = (_b = (_a = dataRef.value) == null ? void 0 : _a.remoteConfig) != null ? _b : {};
      return Object.keys(remoteConfig).map(
        (configName) => ({
          name: configName,
          value: remoteConfig[configName].value
        })
      );
    });
  };
  const useRemoteConfig = (remoteConfigName) => {
    const dataRef = useAbbyData();
    return vue.computed(() => {
      var _a, _b;
      return (_b = (_a = dataRef.value) == null ? void 0 : _a.remoteConfig[remoteConfigName]) == null ? void 0 : _b.value;
    });
  };
  const getFeatureFlagValue = (name) => {
    initGlobalLoader();
    return abby.getFeatureFlag(name);
  };
  const getRemoteConfig = (remoteConfigName) => {
    initGlobalLoader();
    return abby.getRemoteConfig(remoteConfigName);
  };
  const getABTestValue = (testName, lookupObject) => {
    initGlobalLoader();
    const variant = abby.getTestVariant(testName);
    if (lookupObject === void 0) {
      return variant;
    }
    return lookupObject[variant];
  };
  const getABResetFunction = (name) => {
    return () => {
      TestStorageService.remove(config.projectId, name);
    };
  };
  const getVariants = (name) => {
    initGlobalLoader();
    return abby.getVariants(name);
  };
  const updateUserProperties = (user) => {
    abby.updateUserProperties(user);
  };
  const AbbyProvider = {
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object,
        default: void 0
      }
    },
    setup(props, { slots }) {
      const providerDataRef = vue.shallowRef(null);
      if (props.initialData) {
        providerDataRef.value = abby.init(props.initialData);
      } else {
        providerDataRef.value = abby.getProjectData();
        if (typeof window !== "undefined") {
          abby.loadProjectData().then((data) => {
            if (data) {
              providerDataRef.value = data;
            }
          });
        }
      }
      if (typeof window !== "undefined") {
        abby.subscribe((data) => {
          providerDataRef.value = data;
        });
      }
      vue.provide(ABBY_INJECT_KEY, providerDataRef);
      return () => slots.default ? slots.default() : null;
    }
  };
  return {
    useAbby,
    AbbyProvider,
    useFeatureFlag,
    getFeatureFlagValue,
    useRemoteConfig,
    getRemoteConfig,
    getABTestValue,
    __abby__: abby,
    getABResetFunction,
    getVariants,
    useFeatureFlags,
    useRemoteConfigVariables,
    updateUserProperties
  };
}

exports.createAbby = createAbby;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=index.js.map