import { TestStorageService, FlagStorageService, RemoteConfigStorageService } from './chunk-ZDRQBIE2.mjs';
import { Abby, HttpService, AbbyEventType } from '@tryabby/core';
import { shallowRef, computed, provide, inject } from 'vue';

var ABBY_INJECT_KEY = Symbol("abby");
function createAbby(abbyConfig) {
  const abby = new Abby(
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
  const abbyDataRef = shallowRef(abby.getProjectData());
  const useAbbyData = () => {
    const injected = inject(ABBY_INJECT_KEY, null);
    return injected || abbyDataRef;
  };
  const useAbby = (name, lookupObject) => {
    const dataRef = useAbbyData();
    const selectedVariant = computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = dataRef.value) == null ? void 0 : _a.tests[name]) == null ? void 0 : _b.selectedVariant) != null ? _c : "";
    });
    const notify = () => {
      const variant2 = selectedVariant.value;
      if (!name || !variant2)
        return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.PING,
        data: {
          projectId: config.projectId,
          selectedVariant: variant2,
          testName: name
        }
      });
    };
    notify();
    const onAct = () => {
      const variant2 = selectedVariant.value;
      if (!variant2)
        return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
        data: {
          projectId: config.projectId,
          selectedVariant: variant2,
          testName: name
        }
      });
    };
    const variant = computed(() => {
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
    return computed(() => {
      var _a, _b, _c;
      return (_c = (_b = (_a = dataRef.value) == null ? void 0 : _a.flags[name]) == null ? void 0 : _b.value) != null ? _c : false;
    });
  };
  const useFeatureFlags = () => {
    const dataRef = useAbbyData();
    return computed(() => {
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
    return computed(() => {
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
    return computed(() => {
      var _a, _b;
      return (_b = (_a = dataRef.value) == null ? void 0 : _a.remoteConfig[remoteConfigName]) == null ? void 0 : _b.value;
    });
  };
  const getFeatureFlagValue = (name) => {
    return abby.getFeatureFlag(name);
  };
  const getRemoteConfig = (remoteConfigName) => {
    return abby.getRemoteConfig(remoteConfigName);
  };
  const getABTestValue = (testName, lookupObject) => {
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
    return abby.getVariants(name);
  };
  const updateUserProperties = (user) => {
    abby.updateUserProperties(user);
  };
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
  const AbbyProvider = {
    name: "AbbyProvider",
    props: {
      initialData: {
        type: Object,
        default: void 0
      }
    },
    setup(props, { slots }) {
      const providerDataRef = shallowRef(null);
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
      provide(ABBY_INJECT_KEY, providerDataRef);
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

export { createAbby };
//# sourceMappingURL=out.js.map
//# sourceMappingURL=chunk-IUVPAA4G.mjs.map