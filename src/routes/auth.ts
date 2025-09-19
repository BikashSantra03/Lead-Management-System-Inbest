import express from "express";
import { Role } from "@prisma/client";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
    login,
    register,
    updatePassword,
} from "../controllers/authController";

const router = express.Router();

router.post("/login", login);

router.post(
    "/register",
    authenticateToken,
    requireRole([Role.ADMIN]),
    register
); // Admin-only

router.put("/update-password", authenticateToken, updatePassword);

export default router;
