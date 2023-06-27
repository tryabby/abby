#!/usr/bin/env node

import * as Chalk from "chalk";
import * as figlet from "figlet";
import { Command } from "commander";
import { pull } from "./pull";
import { push } from "./push";
import { clear } from "clear";
import { getToken, writeTokenFile } from "./auth";
import chalk from "chalk";

const program = new Command();

// clear();
console.log(figlet.textSync("abby-cli", { horizontalLayout: "full" }));

program.name("abby-cli").description("CLI Tool for Abby").version("0.0.1");

program
  .command("login")
  .argument("<token>", "token")
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
  .action(function () {
    try {
      const token = getToken();
      push(token);
    } catch (e) {
      console.log(chalk.red("Please login first"));
      return;
    }
  });

program.parse(process.argv);
