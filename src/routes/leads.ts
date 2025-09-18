import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
    createLeadHandler,
    getLeadsHandler,
    getLeadByIdHandler,
    updateLeadHandler,
    assignLeadHandler,
    deleteLeadHandler,
} from "../controllers/leadController";

// Express router instance for lead-related routes
const router = express.Router();

// Apply authentication middleware to all lead routes
// Ensures all requests have a valid JWT and req.user is set (id, role)
router.use(authenticateToken);

// POST /api/leads
// Creates a new lead; restricted to MANAGER role (enforced in controller)
router.post("/", createLeadHandler);

// GET /api/leads?status=<status>
// Retrieves all leads (filtered for SALES_REP; full access for MANAGER/ADMIN)
router.get("/", getLeadsHandler);

// GET /api/leads/:id
// Retrieves a single lead by ID (SALES_REP must own; MANAGER/ADMIN full access)
router.get("/:id", getLeadByIdHandler);

// PUT /api/leads/:id
// Updates a lead (SALES_REP limited to ENGAGED/DISPOSED for owned leads; MANAGER/ADMIN full access)
router.put("/:id", updateLeadHandler);

// PUT /api/leads/:id/assign
// Assigns a lead to a sales rep; restricted to MANAGER role (enforced in controller)
router.put("/:id/assign", assignLeadHandler);

// DELETE /api/leads/:id
// Deletes a lead; restricted to MANAGER role (enforced in controller)
router.delete("/:id", deleteLeadHandler);

export default router;
