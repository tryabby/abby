import { Option } from "commander";

export const ConfigOption = new Option(
  "-c, --config <config>",
  "Path to your Abby config file"
);

export const HostOption = new Option(
  "-h, --host <host>",
  "The URL of your Abby instance. Defaults to the cloud version"
);
