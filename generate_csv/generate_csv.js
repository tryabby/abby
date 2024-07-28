"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === "function" &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y["return"]
                  : op[0]
                    ? y["throw"] || ((t = y["return"]) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, "__esModule", { value: true });
var csv_writer_1 = require("csv-writer");
var uuid_1 = require("uuid");
// Constants
var NUM_ENTRIES = 10000000;
var PROJECT_COUNT = 100;
var API_VERSION = "V0";
var TYPES = ["GET_CONFIG", "POST_UPDATE", "DELETE_RECORD", "PUT_RESOURCE"];
// Generate a random date between today and one year ago
function randomDate() {
  var today = new Date();
  var oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  var randomTime = new Date(
    oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime())
  );
  return randomTime.toISOString().replace("T", " ").substring(0, 23);
}
// Generate project IDs
var projectIds = ["clvh4sv5n0001furg6tj08z63"];
// Setup CSV writer
var csvWriter = (0, csv_writer_1.createObjectCsvWriter)({
  path: "ApiRequestFürMeinProject.csv",
  header: [
    { id: "id", title: "id" },
    { id: "createdAt", title: "createdAt" },
    { id: "type", title: "type" },
    { id: "durationInMs", title: "durationInMs" },
    { id: "apiVersion", title: "apiVersion" },
    { id: "projectId", title: "projectId" },
  ],
});
function generateCSV() {
  return __awaiter(this, void 0, void 0, function () {
    var records, i, record;
    return __generator(this, function (_a) {
      switch (_a.label) {
        case 0:
          records = [];
          i = 0;
          _a.label = 1;
        case 1:
          if (!(i < NUM_ENTRIES)) return [3 /*break*/, 4];
          record = {
            id: (0, uuid_1.v4)(),
            createdAt: randomDate(),
            type: TYPES[Math.floor(Math.random() * TYPES.length)],
            durationInMs: Math.floor(Math.random() * 1000) + 1,
            apiVersion: API_VERSION,
            projectId: "clvh4sv5n0001furg6tj08z63",
            //   projectIds[Math.floor(Math.random() * PROJECT_COUNT)],
          };
          records.push(record);
          if (!(records.length === 100000)) return [3 /*break*/, 3];
          return [4 /*yield*/, csvWriter.writeRecords(records)];
        case 2:
          _a.sent();
          records.length = 0; // Clear the array
          _a.label = 3;
        case 3:
          i++;
          return [3 /*break*/, 1];
        case 4:
          if (!(records.length > 0)) return [3 /*break*/, 6];
          return [4 /*yield*/, csvWriter.writeRecords(records)];
        case 5:
          _a.sent();
          _a.label = 6;
        case 6:
          console.log("CSV file generated successfully!");
          return [2 /*return*/];
      }
    });
  });
}
generateCSV().catch(function (err) {
  console.error("Error generating CSV:", err);
});
