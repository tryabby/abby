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

type Sections = {
  flags: boolean;
  remoteConfig: boolean;
  tests: boolean;
};

export function getSections(): Sections {
  try {
    const storedValue = localStorage.getItem("sections");
    return storedValue
      ? JSON.parse(storedValue)
      : ({ flags: true, remoteConfig: true, tests: true } satisfies Sections);
  } catch (error) {
    console.error("Error retrieving sections from localStorage:", error);
    return { flags: true, remoteConfig: true, tests: true };
  }
}

export function setSections(sections: Sections) {
  try {
    localStorage.setItem("sections", JSON.stringify(sections));
  } catch (error) {
    console.error("Error saving sections to localStorage:", error);
  }
}
