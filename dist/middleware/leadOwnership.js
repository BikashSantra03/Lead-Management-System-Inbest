"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireLeadOwnership = void 0;
const database_1 = __importDefault(require("../config/database"));
const client_1 = require("@prisma/client");
// Ensures sales reps can only access leads assigned to them
const requireLeadOwnership = async (req, res, next) => {
    // Check if user exists and is a sales rep; if not, bypass check for managers/admins
    if (!req.user || req.user.role !== client_1.Role.SALES_REP) {
        return next();
    }
    const { id } = req.params;
    const lead = await database_1.default.lead.findUnique({
        where: { id },
        select: { assignedTo: true },
    });
    // If lead doesn't exist or isn't assigned to the requesting sales rep, deny access
    if (!lead || lead.assignedTo !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Access denied: Lead not assigned to you",
        });
    }
    // Lead ownership verified; proceed to the next middleware or controller
    next();
};
exports.requireLeadOwnership = requireLeadOwnership;
