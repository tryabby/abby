#!/usr/bin/env node

import * as Chalk from "chalk";
import * as figlet from "figlet";
import { program } from "commander";
import { pull } from "./pull";
import {push} from "./push";
// import {clear} from "clear";

// clear();
console.log(figlet.textSync("abby-cli", { horizontalLayout: "full" }));

// push("cljcmkhsv0000adwah7sslnqh");

program
  .version("0.0.1")
  .description("CLI Tool for Abby")
  .command("login", "Login")
    .option("-t", "token")
  .command("push", "create tests & flags")
  .parse(process.argv);


const options = program.opts();


