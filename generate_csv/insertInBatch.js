"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clickhouseClient = void 0;
var uuid_1 = require("uuid");
var client_1 = require("@clickhouse/client");
exports.clickhouseClient = (0, client_1.createClient)();
// Constants
var NUM_ENTRIES = 10000000 / 10000; // Number of entries you want to insert
var PROJECT_COUNT = 100;
var API_VERSION = "V0";
var TYPES = ["GET_CONFIG", "POST_UPDATE", "DELETE_RECORD", "PUT_RESOURCE"];
var BATCH_SIZE = 10000 / 10; // Size of each batch
// Generate a random date between today and one year ago
function randomDate() {
    var today = new Date();
    var oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    var randomTime = new Date(oneYearAgo.getTime() + Math.random() * (today.getTime() - oneYearAgo.getTime()));
    return randomTime.toISOString().replace("T", " ").substring(0, 19);
}
var projectIds = [
    "clvh4sv5n0001furg6tj08z63",
    //   "8e0ad326-c7d4-4daa-a004-585ca96d8e71",
    //   "4e236852-6ef1-44e2-a15e-9463fed3921f",
    //   "d4c607ea-d9e8-44a3-b12e-749225cb0599",
    //   "c4111aec-5677-4d2d-8d71-de8e49f79c26",
    //   "e4b69866-a985-4100-8bdc-64672e2ebefe",
    //   "8716a142-b424-48b6-8051-5ab5ce6b06cb",
    //   "20895eff-723c-4c76-8334-cf32ce72501a",
    //   "e00683fb-eca8-419c-a9e6-f4526ad93aa4",
    //   "43e225d6-d5ef-4c0c-a435-7ea1ebe2f74c",
    //   "ed4ffef2-790d-4850-b075-e589978a56c4",
    //   "f13778dd-b360-48be-ab7a-d97c048d99ba",
    //   "097cd30d-e654-44f5-b379-7a69c594e986",
    //   "d1e049e5-823d-44b3-845d-1ca9609cb657",
    //   "e23231e3-a18b-48ae-a496-a625c29ecdfe",
    //   "2f01a0b2-cc78-4f8e-b77e-322a3321ea44",
    //   "76a50abb-7908-4cce-b168-a8709965b5f9",
    //   "a3660a3f-525d-4d66-bf90-0bf2313ffbfc",
    //   "d9d3736e-1ba2-43bf-8c1c-b1c33436ceba",
    //   "e73dbf0d-4919-47d6-a63f-1fc1258a5673",
    //   "e859f1e1-f004-4a02-aecb-2ecd413aca3f",
    //   "0e3687cb-1cbc-44dd-a057-c0e35d9de8c2",
    //   "9868de0f-6e53-4e21-b480-cf97a8f6cb7d",
    //   "83a051fa-e4b3-4965-b0b9-a850ccc2d78d",
    //   "6d473975-5d1c-4ac5-9ba6-068cdca0c77e",
    //   "3b9fa79c-c190-4869-b15f-731f0167d453",
    //   "3c1c27db-ce33-4d21-9108-81b3b7f11a54",
    //   "28834d98-282b-49bd-978d-692f3da4003e",
    //   "cd64cfcc-02df-495c-a0a0-d9fe9a6ca474",
    //   "242d0023-50d7-467f-ac96-602b938c03a8",
    //   "56c4ccb6-f81d-4443-86d9-537e3bc341ed",
    //   "c743ef78-262c-4a37-ab7f-ea3178f3d2a5",
    //   "27ac8acf-b401-422d-93ce-6b6f861d9b19",
    //   "a09f6643-1a40-40d1-b9cd-e14c7d8a8584",
    //   "01b84b17-00fa-45e5-ac2f-2780c5476fe6",
    //   "98509dc4-4c90-4fb7-a473-f2db017f21ca",
    //   "37f0a317-c7ce-4e26-b190-e17191dc1b8a",
    //   "db0ec165-3fa3-4f0d-82aa-0fccb737f9ad",
    //   "ad8e5c90-f946-44a8-89e5-a34df667840d",
    //   "11dbb0f1-1b94-41c2-8737-116f2849a9ae",
    //   "d5c7330c-d959-47fc-b02f-39926595ccd2",
    //   "34fb504d-27b1-4053-af62-20767115278c",
    //   "e86905a1-5fbe-463c-ae35-274d6516df95",
    //   "2530fba6-cae4-4907-9369-5616b1aa29c2",
    //   "470d8dda-2e6c-40de-bfd8-6eccdb21169b",
    //   "83c04edc-659b-476b-8cf3-e0cad8c78c1d",
    //   "1f8937ba-f6fa-4dd6-ad4d-2fe88c7beed1",
    //   "573aa5e6-e66f-4c57-8de0-eb4af5be80f7",
    //   "2839c716-1bdf-4d1d-bcde-c85fd7879e47",
    //   "f6450cfc-2937-4d1c-8054-2a2ab56af0c8",
    //   "ac761d46-a959-435c-98ed-72e86f42dd91",
    //   "8ab88073-88f2-4fa1-9ece-2e77daf22900",
    //   "8f72ec17-2c08-452c-9f82-f8270b8c211f",
    //   "cf2cf72f-61f4-48da-b9d6-03860cdd1a51",
    //   "6887099b-a5ca-42f3-830f-6b9e17bcc405",
    //   "1408e392-4e39-4841-a722-dfc467b5aea7",
    //   "a7648ad8-bd9b-4def-ad30-8f6a8ffe790c",
    //   "dc1cdf87-7e65-4e35-8c84-53cc45061e5d",
    //   "a62d6dbe-df0b-40ca-93d9-0b175671f858",
    //   "51449cc3-25e0-46d4-b1db-afc21d274a77",
    //   "5581bc22-3f75-49dd-bad3-7b39c6a6fa47",
    //   "a9999a00-0a6f-43d8-b277-96fb027361fe",
    //   "cea38acb-76d5-407d-8c41-43faab812206",
    //   "9db2bb0e-e227-4527-8d91-5f6dff7f3e67",
    //   "72a47b93-313a-42f4-a51e-b850eb18e3fd",
    //   "05c44513-0a4b-4b98-8ffc-ae44dafa3a54",
    //   "4622ec76-0fd7-4226-bdaf-eceb7e2444f2",
    //   "bf49128d-7899-43d9-a2b0-64297df9f057",
    //   "313e1413-b3b5-4952-bd08-5f34fb7e5744",
    //   "d28ccf5b-3ea1-46a0-8ed1-56db7a52de7c",
    //   "3ebad352-ef41-4f15-931d-6f077c4e6307",
    //   "0f969120-52c3-436f-b027-9723e10c1780",
    //   "78462cc2-ef73-446e-a244-bf786ac481c2",
    //   "06be3cee-0603-41cb-affd-3d1c15056586",
    //   "26f0887c-617d-46eb-8629-eb0690a85387",
    //   "14778b80-cd6c-43df-9010-ef8c9bcf801b",
    //   "93db3706-6682-43f7-9720-60056e96a898",
    //   "ad5ed7d9-40a8-4b63-8ccd-346fe618744c",
    //   "6d6adca8-153c-44dc-ac99-e42ee41d2883",
    //   "dff18ffe-0ef4-484b-8354-583252291f39",
    //   "89befa8a-a98e-4912-9843-f861633c2ab8",
    //   "835c14d1-399e-4740-9e55-4fa83b6ce045",
    //   "7c96f67f-8b72-43fb-8129-29f168fa0dd8",
    //   "f16211d7-b2b9-4d02-9f76-d8c23853a91f",
    //   "7b1a000a-c0c9-411c-a5dc-622297a99b12",
    //   "0213a399-d761-434b-ae6e-7faa6b53809b",
    //   "05456e2e-dcd3-40de-ba43-f8dd4c8c34b9",
    //   "9efce5d6-818a-4d14-961f-c74111b4aab2",
    //   "0072cf6a-aef2-4fe6-b069-eec7c1f13c93",
    //   "40aa3f60-0532-4628-9871-baa54ddc76c0",
    //   "877b1e77-8bea-4163-81ce-7b7d110557f4",
    //   "806592b9-0683-4fb4-9afc-aee808941de0",
    //   "fb89e622-be0d-4e38-8f8a-687b118d9fbb",
    //   "32ab0418-63e6-4ef0-8e18-d830ded901c0",
    //   "468a66dc-f550-4c76-be49-2040c381f42f",
    //   "c8f66b78-3675-4d66-928e-ae37ea3d89fa",
    //   "0ea8c1bb-4ae7-4af6-b684-535e7cece274",
    //   "c7b06ef9-b9ad-481e-b61b-25bc4edfafd0",
    //   "a8414689-91b6-4d35-a53e-b49fafd39fc2",
    //   "79db2c3f-f544-46cb-b5e3-fb1a752880b8",
    //   "86584601-342c-4f1c-b739-fb20187e9c52",
];
function insertBatch(records) {
    return __awaiter(this, void 0, void 0, function () {
        var query, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    query = "\n    INSERT INTO abby.ApiRequest (id, createdAt, type, durationInMs, apiVersion, projectId)\n    VALUES ".concat(records.map(function (record) { return "('".concat(record.id, "', '").concat(record.createdAt, "', '").concat(record.type, "', ").concat(record.durationInMs, ", '").concat(record.apiVersion, "', '").concat(record.projectId, "')"); }).join(","), "\n  ");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, exports.clickhouseClient.query({
                            query: query,
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error inserting batch:", error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function generateAndInsertRecords() {
    return __awaiter(this, void 0, void 0, function () {
        var records, batchCount, i, record;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    records = [];
                    batchCount = 0;
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
                        projectId: projectIds[Math.floor(Math.random() * PROJECT_COUNT)],
                    };
                    records.push(record);
                    if (!(records.length >= BATCH_SIZE)) return [3 /*break*/, 3];
                    console.log("Inserting batch ".concat(++batchCount));
                    return [4 /*yield*/, insertBatch(records)];
                case 2:
                    _a.sent();
                    records.length = 0; // Clear the array
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (!(records.length > 0)) return [3 /*break*/, 6];
                    console.log("Inserting final batch ".concat(++batchCount));
                    return [4 /*yield*/, insertBatch(records)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    console.log("Data insertion completed successfully!");
                    return [2 /*return*/];
            }
        });
    });
}
generateAndInsertRecords().catch(function (err) {
    console.error("Error generating or inserting records:", err);
});
