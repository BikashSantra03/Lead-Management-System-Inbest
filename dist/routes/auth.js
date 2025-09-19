"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const rbac_1 = require("../middleware/rbac");
const authController_1 = require("../controllers/authController");
const router = express_1.default.Router();
router.post("/login", authController_1.login);
router.post("/register", auth_1.authenticateToken, (0, rbac_1.requireRole)([client_1.Role.ADMIN]), authController_1.register); // Admin-only
router.put("/update-password", auth_1.authenticateToken, authController_1.updatePassword);
exports.default = router;
