#!/usr/bin/env node

import * as figlet from "figlet";
import { Command } from "commander";
import { pull } from "./pull";
import { push } from "./push";
import { getToken, writeTokenFile } from "./auth";
import chalk from "chalk";

const program = new Command();

// clear();
console.log(figlet.textSync("abby-cli", { horizontalLayout: "full" }));

program.name("abby-cli").description("CLI Tool for Abby").version("0.0.1");

program
  .command("login")
  .argument("<token>", "token")
  .option("-l, --localhost", "localhost")
  .action((token) => {
    if (token) {
      writeTokenFile(token);
    } else {
      console.log(chalk.red("Token is required"));
    }
  });

program
  .command("push")
  .description("push local config to server")
  .argument("<filepath>", "filepath")
  .option("-l, --localhost", "localhost")
  .action((filepath, options) => {
    if (!filepath) {
      console.log(chalk.red("Filename is required"));
      return;
    }
    try {
      const token: string = getToken();
      console.log(filepath);
      console.log(options.localhost);
      push(filepath, token, options.localhost);
    } catch (e) {
      console.log(chalk.red("Please login first"));
      return;
    }
  });

program.parse(process.argv);
