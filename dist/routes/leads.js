"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const leadController_1 = require("../controllers/leadController");
// Express router instance for lead-related routes
const router = express_1.default.Router();
// Apply authentication middleware to all lead routes
// Ensures all requests have a valid JWT and req.user is set (id, role)
router.use(auth_1.authenticateToken);
// POST /api/leads
// Creates a new lead; restricted to MANAGER role (enforced in controller)
router.post("/", leadController_1.createLeadHandler);
// GET /api/leads?status=<status>
// Retrieves all leads (filtered for SALES_REP; full access for MANAGER/ADMIN)
router.get("/", leadController_1.getLeadsHandler);
// GET /api/leads/:id
// Retrieves a single lead by ID (SALES_REP must own; MANAGER/ADMIN full access)
router.get("/:id", leadController_1.getLeadByIdHandler);
// PUT /api/leads/:id
// Updates a lead (SALES_REP limited to ENGAGED/DISPOSED for owned leads; MANAGER/ADMIN full access)
router.put("/:id", leadController_1.updateLeadHandler);
// PUT /api/leads/:id/assign
// Assigns a lead to a sales rep; restricted to MANAGER role (enforced in controller)
router.put("/:id/assign", leadController_1.assignLeadHandler);
// DELETE /api/leads/:id
// Deletes a lead; restricted to MANAGER role (enforced in controller)
router.delete("/:id", leadController_1.deleteLeadHandler);
exports.default = router;
