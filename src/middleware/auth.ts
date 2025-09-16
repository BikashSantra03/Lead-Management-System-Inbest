import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { AuthRequest } from "../types";

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token)
        return res
            .status(401)
            .json({ success: false, message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err)
            return res
                .status(403)
                .json({ success: false, message: "Invalid or expired token" });
        req.user = user as { id: string; role: Role };
        next();
    });
};
