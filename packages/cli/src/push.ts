import { createFlag, createTest, getConfigFromServer } from "./http";
import { getConfigFromFileString, loadLocalConfig } from "./util";

export async function push(filePath: string, apiKey: string): Promise<void> {
  const localConfigString = await loadLocalConfig(filePath);
  const localAbbyConfig = getConfigFromFileString(localConfigString);
  const projectId = localAbbyConfig.projectId;

  // const serverConfigData = await getConfigFromServer(projectId, true); // TODO set debug to false

  try {
    const response = await fetch(
      `http://localhost:3000/api/config/${projectId}?apiKey=${apiKey}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localAbbyConfig),
      }
    );
    // const res = await response;
    const data = await response.json();
    const status = response.status;

    if (status == 200) {
      console.log("pushed successfully");
    } else {
      console.log("pushed failed: \n" + status + ": " + data);
    }
  } catch (e) {
    console.log("Error: " + e);
  }
}
