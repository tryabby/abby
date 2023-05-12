const DEVTOOLS_KEY = "abbyy-devtools";

export function getShowDevtools() {
  const storedValue = localStorage.getItem(DEVTOOLS_KEY);
  return {
    hasStoredValue: !!storedValue,
    showDevtools: localStorage.getItem(DEVTOOLS_KEY) === "true",
  };
}

export function setShowDevtools(value: boolean) {
  localStorage.setItem(DEVTOOLS_KEY, JSON.stringify(value));
}
