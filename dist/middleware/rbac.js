"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ success: false, message: "Insufficient permissions" });
        }
        next();
    };
};
exports.requireRole = requireRole;
// Usage: requireRole(['ADMIN']) for admin-only
