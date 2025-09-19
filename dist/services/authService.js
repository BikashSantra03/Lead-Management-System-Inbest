"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserPassword = exports.registerUser = exports.loginUser = void 0;
const database_1 = __importDefault(require("../config/database"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validators_1 = require("../utils/validators");
const utils_1 = require("../utils");
const logger_1 = __importDefault(require("../utils/logger"));
const registrationSuccess_1 = require("../mail/templates/registrationSuccess");
const mailsender_1 = __importDefault(require("../utils/mailsender"));
const loginUser = async (data) => {
    try {
        // Validate input data
        const validatedData = validators_1.loginSchema.parse(data);
        // Check if user exists
        const user = await database_1.default.user.findUnique({
            where: { email: validatedData.email },
        });
        if (!user) {
            const error = new Error("User not registered, please register first!");
            logger_1.default.error(`Login failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }
        if (!(await (0, utils_1.comparePassword)(validatedData.password, user.password))) {
            const error = new Error("Invalid credentials");
            logger_1.default.error(`Login failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
        // Log successful login
        logger_1.default.info(`User logged in successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return {
            user: { id: user.id, email: user.email, role: user.role },
            token,
        };
    }
    catch (error) {
        // Log validation or unexpected errors
        logger_1.default.error(`Login error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller to handle
    }
};
exports.loginUser = loginUser;
const registerUser = async (data) => {
    try {
        // Validate input data
        const validatedData = validators_1.registerSchema.parse(data);
        // Check if user already exists
        const existingUser = await database_1.default.user.findUnique({
            where: { email: validatedData.email },
        });
        if (existingUser) {
            const error = new Error("User with this email already exists");
            logger_1.default.error(`Registration failed: ${error.message}`, {
                email: validatedData.email,
            });
            throw error;
        }
        // Hash password
        const hashedPassword = await (0, utils_1.hashPassword)(validatedData.password, 10);
        // Create user
        const user = await database_1.default.user.create({
            data: { ...validatedData, password: hashedPassword },
        });
        // Send registration email with username, email, and plain-text password
        const emailBody = (0, registrationSuccess_1.registrationSuccess)(user.email, user.name, validatedData.password);
        await (0, mailsender_1.default)(user.email, "Registration Successful", emailBody);
        // Log successful registration
        logger_1.default.info(`User registered successfully`, {
            userId: user.id,
            email: user.email,
            role: user.role,
        });
        return user;
    }
    catch (error) {
        // Log validation or database errors
        logger_1.default.error(`Registration error: ${error.message}`, {
            email: data.email,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.registerUser = registerUser;
const updateUserPassword = async (userId, data) => {
    try {
        // Validate input data
        const validatedData = validators_1.updatePasswordSchema.parse(data);
        // Find user by ID
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            const error = new Error("User not found");
            logger_1.default.error(`Password update failed: ${error.message}`, {
                userId,
            });
            throw error;
        }
        // Verify current password
        if (!(await (0, utils_1.comparePassword)(validatedData.currentPassword, user.password))) {
            const error = new Error("Current password is incorrect");
            logger_1.default.error(`Password update failed: ${error.message}`, {
                userId,
            });
            throw error;
        }
        // Hash new password
        const hashedPassword = await (0, utils_1.hashPassword)(validatedData.newPassword, 10);
        // Update password
        await database_1.default.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
        // Log successful password update
        logger_1.default.info(`Password updated successfully`, {
            userId,
        });
        return { message: "Password updated successfully" };
    }
    catch (error) {
        // Log validation or database errors
        logger_1.default.error(`Password update error: ${error.message}`, {
            userId,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.updateUserPassword = updateUserPassword;
