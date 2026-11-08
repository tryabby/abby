// src/createAbby.ts
import {
  Abby,
  AbbyEventType,
  HttpService
} from "@tryabby/core";
import { computed, shallowRef } from "vue";

// src/StorageService.ts
import {
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey
} from "@tryabby/core";
import Cookie from "js-cookie";
var DEFAULT_COOKIE_AGE = 365;
var ABStorageService = class {
  get(projectId, testName) {
    return Cookie.get(getABStorageKey(projectId, testName)) ?? null;
  }
  set(projectId, testName, value, options) {
    Cookie.set(getABStorageKey(projectId, testName), value, {
      expires: options?.expiresInDays ?? DEFAULT_COOKIE_AGE
    });
  }
  remove(projectId, testName) {
    Cookie.remove(getABStorageKey(projectId, testName));
  }
};
var FFStorageService = class {
  get(projectId, flagName) {
    return Cookie.get(getFFStorageKey(projectId, flagName)) ?? null;
  }
  set(projectId, flagName, value) {
    Cookie.set(getFFStorageKey(projectId, flagName), value, { expires: DEFAULT_COOKIE_AGE });
  }
  remove(projectId, flagName) {
    Cookie.remove(getFFStorageKey(projectId, flagName));
  }
};
var RCStorageService = class {
  get(projectId, key) {
    return Cookie.get(getRCStorageKey(projectId, key)) ?? null;
  }
  set(projectId, key, value) {
    Cookie.set(getRCStorageKey(projectId, key), value, { expires: DEFAULT_COOKIE_AGE });
  }
  remove(projectId, key) {
    Cookie.remove(getRCStorageKey(projectId, key));
  }
};
var TestStorageService = new ABStorageService();
var FlagStorageService = new FFStorageService();
var RemoteConfigStorageService = new RCStorageService();

// src/createAbby.ts
function createAbby(config) {
  const abby = new Abby(
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
  const data = shallowRef(abby.getProjectData());
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
    const rawVariant = computed(
      () => data.value.tests[name]?.selectedVariant ?? abby.getTestVariant(name)
    );
    const variant = computed(() => {
      const selected = rawVariant.value;
      return lookupObject ? lookupObject[selected] : selected;
    });
    const onAct = () => {
      const selectedVariant = rawVariant.value;
      if (!selectedVariant)
        return;
      HttpService.sendData({
        url: config.apiUrl,
        type: AbbyEventType.ACT,
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
    return computed(() => data.value.flags[name]?.value ?? abby.getFeatureFlag(name));
  };
  const useRemoteConfig = (name) => {
    ensureLoaded();
    return computed(
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
import { defineConfig } from "@tryabby/core";
export {
  createAbby,
  defineConfig
};
