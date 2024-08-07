import {
  type IStorageService,
  getABStorageKey,
  getFFStorageKey,
  getRCStorageKey,
} from "@tryabby/core";

class ABStorageService implements IStorageService {
  get(projectId: string, testName: string): string | null {
    const name = `${getABStorageKey(projectId, testName)}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  set(projectId: string, testName: string, value: string): void {
    const token = getABStorageKey(projectId, testName);
    document.cookie = `${token}=${value}`;
  }

  remove(projectId: string, testName: string): void {
    const token = getABStorageKey(projectId, testName);
    document.cookie = `${token}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

class FFStorageService implements IStorageService {
  get(projectId: string, flagName: string): string | null {
    const name = `${getFFStorageKey(projectId, flagName)}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }

  set(projectId: string, flagName: string, value: string): void {
    const token = getFFStorageKey(projectId, flagName);
    document.cookie = `${token}=${value}`;
  }

  remove(projectId: string, flagName: string): void {
    const token = getFFStorageKey(projectId, flagName);
    document.cookie = `${token}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

class RCStorageService implements IStorageService {
  get(projectId: string, key: string): string | null {
    const name = `${getRCStorageKey(projectId, key)}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(";");

    for (let i = 0; i < cookieArray.length; i++) {
      let cookie = cookieArray[i];
      while (cookie.charAt(0) === " ") {
        cookie = cookie.substring(1);
      }
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length, cookie.length);
      }
    }
    return null;
  }
  set(projectId: string, key: string, value: string): void {
    const token = getRCStorageKey(projectId, key);
    document.cookie = `${token}=${value}`;
  }

  remove(projectId: string, key: string): void {
    const token = getRCStorageKey(projectId, key);
    document.cookie = `${token}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

export const TestStorageService = new ABStorageService();
export const FlagStorageService = new FFStorageService();
export const RemoteConfigStorageService = new RCStorageService();
