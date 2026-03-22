"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const PostSchema = new mongoose_1.default.Schema({
    text: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    author: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });
exports.default = mongoose_1.default.model('Post', PostSchema);
