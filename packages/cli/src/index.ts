#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import * as figlet from "figlet";
import ora from "ora";
import packageJson from "../package.json";
import { addFlag } from "./add-flag";
import { addRemoteConfig } from "./add-remote-config";
import { removeFlagInstance } from "./ai";
import { getToken, writeTokenFile } from "./auth";
import { verifyLocalConfig } from "./check";
import { ABBY_BASE_URL, getTokenFilePath } from "./consts";
import { initAbbyConfig } from "./init";
import { pullAndMerge } from "./pull";
import { push } from "./push";
import { addCommandTypeSchema } from "./schemas";
import { ConfigOption, HostOption } from "./sharedOptions";
import { multiLineLog, startServerAndGetToken } from "./util";

const program = new Command();

console.log(
  chalk.magenta(figlet.textSync("abby-cli", { horizontalLayout: "full" }))
);

program
  .name("abby-cli")
  .description("CLI Tool for Abby")
  .version(packageJson.version);

program
  .command("login")
  .addOption(HostOption)
  .option("-t, --token <token>", "token")
  .action(async ({ token, host }: { token?: string; host?: string }) => {
    let tokenToUse = token;

    // the token parameter is optional, if not given we start a login flow
    if (typeof token !== "string") {
      tokenToUse = await startServerAndGetToken(host);
    }

    if (typeof tokenToUse === "string") {
      await writeTokenFile(tokenToUse);
      console.log(
        chalk.green(`Token successfully written to ${getTokenFilePath()}`)
      );
    } else {
      console.log(
        chalk.red("You need to provide a token to log in."),
        chalk.green(`\nYou can get one at ${ABBY_BASE_URL}/profile`)
      );
    }
  });

program
  .command("pull")
  .addOption(HostOption)
  .addOption(ConfigOption)
  .action(async (options: { config?: string; host?: string }) => {
    try {
      const token = await getToken();
      await pullAndMerge({
        apiKey: token,
        apiUrl: options.host,
        configPath: options.config,
      });
    } catch (e) {
      console.log(
        chalk.red(
          multiLineLog(
            e instanceof Error
              ? e.message
              : "Something went wrong. Please check your internet connection"
          )
        )
      );
    }
  });

program
  .command("push")
  .description("push local config to server")
  .addOption(HostOption)
  .addOption(ConfigOption)
  .action(async (options: { config?: string; host?: string }) => {
    try {
      const token = await getToken();
      await push({
        apiKey: token,
        apiUrl: options.host,
        configPath: options.config,
      });
    } catch (e) {
      console.log(
        chalk.red(
          multiLineLog(
            e instanceof Error
              ? e.message
              : "Something went wrong. Please check your internet connection"
          )
        )
      );
    }
  });

program
  .command("add")
  .description("create a new flag or remote config both locally and remotely")
  .argument("<entryType>", "Whether you want to create a `flag` or `config`")
  .addOption(HostOption)
  .addOption(ConfigOption)
  .action(
    async (entryType, options: { configPath?: string; host?: string }) => {
      const parsedEntryType = addCommandTypeSchema.safeParse(entryType);

      if (!parsedEntryType.success) {
        console.log(
          chalk.red(
            "Invalid type. Only `flag` or `config` are possible or leave the option empty"
          )
        );
        return;
      }

      try {
        const token = await getToken();
        switch (parsedEntryType.data) {
          case "flag":
            await addFlag({ ...options, apiKey: token });
            break;
          case "config":
            await addRemoteConfig({ ...options, apiKey: token });
            break;
        }
      } catch (e) {
        console.log(
          chalk.red(
            multiLineLog(
              e instanceof Error
                ? e.message
                : "Something went wrong. Please check your internet connection"
            )
          )
        );
      }
    }
  );

program
  .command("check")
  .description("check local config against server")
  .addOption(HostOption)
  .addOption(ConfigOption)
  .action(async (options: { config?: string; host?: string }) => {
    try {
      const token = await getToken();
      const { isValid, invalidFlags, invalidTests } = await verifyLocalConfig({
        apiKey: token,
        apiUrl: options.host,
        configPath: options.config,
      });
      if (isValid) {
        console.log(chalk.green("Local config is up to date"));
      } else {
        console.log(
          chalk.red("Local config is not up to date"),
          chalk.red(`Invalid flags: ${invalidFlags.join(", ")}`),
          chalk.red(`Invalid tests: ${invalidTests.join(", ")}}`)
        );
      }
    } catch (e) {
      console.log(
        chalk.red(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please check your internet connection"
        )
      );
      return;
    }
  });

program
  .command("init")
  .description("create your local config file")
  .addOption(ConfigOption)
  .action(async (options: { config?: string }) => {
    try {
      const configPath = options.config ?? "./abby.config.ts";
      await initAbbyConfig({ path: configPath });
      console.log(
        chalk.green(`Config file created successfully at ${configPath}`)
      );
    } catch (e) {
      console.log(
        chalk.red(
          e instanceof Error
            ? e.message
            : "Something went wrong. Please check your internet connection"
        )
      );
      return;
    }
  });

const aiCommand = program.command("ai").description("Abby AI helpers");

aiCommand
  .command("remove")
  .description("remove a flag from your code")
  .argument("<dir>", "The directory to scan for")
  .argument("<flag>", "The flag name to remove")
  .addOption(ConfigOption)
  .addOption(HostOption)
  .action(
    async (
      dir: string,
      flagName: string,
      options: { config?: string; host?: string }
    ) => {
      const spinner = ora("Removing feature flag with ✨AI✨").start();
      const updatedFileCount = await removeFlagInstance({
        apiKey: await getToken(),
        flagName,
        path: dir,
        configPath: options.config,
        host: options.host,
      });
      spinner.succeed();
      console.log(chalk.green("\nFlag removed successfully"));
      console.log(chalk.green("Files updated:", updatedFileCount));
    }
  );

program.parse(process.argv);
