"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const port = process.env.PORT || 5000;
(0, index_1.default)().then((app) => {
    console.log("after init app.");
    app.listen(port, () => {
        console.log(`Example app listening at http://localhost:${port}`);
    });
});
