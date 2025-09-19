"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashPassword = async (password, saltRounds = 10) => {
    try {
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        return hashedPassword;
    }
    catch (error) {
        throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt_1.default.compare(password, hashedPassword);
    }
    catch (error) {
        throw new Error(`Password comparison failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
};
exports.comparePassword = comparePassword;
