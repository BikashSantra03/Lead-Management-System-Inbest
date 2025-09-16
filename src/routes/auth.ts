import express from "express";
import { Role } from "@prisma/client";

import { authenticateToken } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
    createInitAdmin,
    login,
    register,
} from "../controllers/authController";

const router = express.Router();

router.post("/login", login);

router.post(
    "/register",
    authenticateToken,
    requireRole([Role.ADMIN]),
    register
); // Admin-only

router.post("/init-admin", createInitAdmin); // One-time admin creation, no auth required

export default router;
