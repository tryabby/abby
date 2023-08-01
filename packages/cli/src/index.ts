#!/usr/bin/env node
import * as figlet from "figlet";
import { Command } from "commander";
import { pullAndMerge } from "./pull";
import { push } from "./push";
import { getToken, writeTokenFile } from "./auth";
import chalk from "chalk";
import { check } from "./check";
import { getTokenFilePath } from "./consts";

const program = new Command();

console.log(figlet.textSync("abby-cli", { horizontalLayout: "full" }));

program.name("abby-cli").description("CLI Tool for Abby").version("0.0.1");

program
  .command("login")
  .option("-t, --token <token>", "token")
  .action(async ({ token }) => {
    if (typeof token === "string") {
      await writeTokenFile(token);
      console.log(chalk.green(`Token successfully written to ${getTokenFilePath()}`));
    } else {
      console.log(chalk.red("You need to provide a token to log in"));
    }
  });

program
  .command("pull")
  .option("-l, --localhost", "localhost")
  .action(async (options) => {
    try {
      const token: string = await getToken();
      await pullAndMerge({
        apiKey: token,
        localhost: options.localhost,
      });
    } catch (e) {
      console.error(e);
    }
  });

program
  .command("push")
  .description("push local config to server")
  .option("-l, --localhost", "localhost")
  .action(async (options) => {
    try {
      const token: string = await getToken();
      await push({ apiKey: token, localhost: options.localhost });
    } catch (e) {
      console.log(chalk.red("Please login first"));
      return;
    }
  });

program
  .command("check")
  .description("check local config against server")
  .option("-l, --localhost", "localhost")
  .action(async (options) => {
    try {
      const token: string = await getToken();
      const upToDate = await check(token, options.localhost);
      if (upToDate) {
        console.log(chalk.green("Local config is up to date"));
      } else {
        console.log(chalk.red("Local config is not up to date"));
      }
    } catch (e) {
      console.error(e);
      console.log(chalk.red("Please login first"));
      return;
    }
  });

program.parse(process.argv);
