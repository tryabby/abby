#!/usr/bin/env node

import * as Chalk from "chalk";
import * as figlet from "figlet";
import { program } from "commander";
import { pull } from "./pull";
// import {clear} from "clear";

// clear();
console.log(figlet.textSync("abby-cli", { horizontalLayout: "full" }));

pull();

// program
//   .version("0.0.1")
//   .description("CLI Tool for Abby")
//   .command("login", "Login")
//   .command("push", "create tests & flags")
//   .option("-p, --peppers", "Add peppers")
//   .option("-P, --pineapple", "Add pineapple")
//   .parse(process.argv);
