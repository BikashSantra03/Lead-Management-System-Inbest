import express from "express";
import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
    loginHandler,
    registerHandler,
    updatePasswordHandler,
} from "../controllers/authController";
import { Role } from "@prisma/client";
const router = express.Router();

router.post("/login", loginHandler);

router.post(
    "/register",
    authenticateToken,
    requireRole([Role.ADMIN]), //Only Admin Can register other members
    registerHandler
);
router.put("/update-password", authenticateToken, updatePasswordHandler);

export default router;
