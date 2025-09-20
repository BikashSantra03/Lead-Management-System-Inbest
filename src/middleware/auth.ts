import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "../types";
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    // Check Authorization header first
    let token = req.headers.authorization?.split(" ")[1];

    // Fallback to cookie if Authorization header is missing
    if (!token && req.cookies?.Token) {
        token = req.cookies.Token;
    }

    // console.log("Token received:", token); // Debug log

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) {
            // console.log("JWT verification error:", err.message); // Debug log
            return res
                .status(403)
                .json({ success: false, message: "Invalid or expired token" });
        }
        // console.log("Authenticated user:", user); // Debug log
        req.user = user as { id: string; role: Role };
        next();
    });
};
