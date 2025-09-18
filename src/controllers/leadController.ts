import { Request, Response } from "express";
import { Role } from "@prisma/client";
import {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    assignLead,
    deleteLead,
} from "../services/leadService";
import { AuthRequest } from "../types";
import { requireLeadOwnership } from "../middleware/leadOwnership";
import { requireRole } from "../middleware/rbac";

/**
 * Handler for creating a new lead (POST /api/leads)
 * Restricted to MANAGER roles only
 */
export const createLeadHandler = [
    requireRole([Role.MANAGER]),

    async (req: AuthRequest, res: Response) => {
        try {
            const lead = await createLead(req.body, req.user!.id);

            res.status(201).json({ success: true, data: lead });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
];

/**
 * Handler for retrieving all leads (GET /api/leads?status=)
 * Accessible to all authenticated roles (filtered for sales reps)
 */
export const getLeadsHandler = [
    // No role middleware; all authenticated users can view (sales reps filtered in service)
    async (req: AuthRequest, res: Response) => {
        try {
            // Pass user ID, role, and query params (e.g., ?status=ENGAGED) to service
            // Service applies RBAC (sales reps see only assigned leads)
            const leads = await getLeads(
                req.user!.id,
                req.user!.role,
                req.query
            );

            res.json({ success: true, data: leads });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
];

/**
 * Handler for retrieving a single lead by ID (GET /api/leads/:id)
 * Sales reps must own the lead;
 * Managers/Admin have full access
 */
export const getLeadByIdHandler = [
    // Apply ownership middleware (ensures sales reps only access their leads)
    requireLeadOwnership,

    async (req: AuthRequest, res: Response) => {
        try {
            // Fetch lead by ID with role-based access (enforced in service + middleware)
            const lead = await getLeadById(
                req.params.id,
                req.user!.id,
                req.user!.role
            );
            // Return lead with full details (assignee, creator, activities)
            res.json({ success: true, data: lead });
        } catch (error: any) {
            // Handle not found (404) or access denied (from service)
            res.status(404).json({ success: false, message: error.message });
        }
    },
];

/**
 * Handler for updating a lead  (PUT /api/leads/:id)
 * Sales reps can only update status/notes for owned leads
 * Managers/Admin have full access
 */
export const updateLeadHandler = [
    // Apply ownership middleware (ensures sales reps only update their leads)
    requireLeadOwnership,

    async (req: AuthRequest, res: Response) => {
        try {
            // Pass lead ID, update data, user ID, and role to service
            // Service enforces sales rep status restrictions (ENGAGED/DISPOSED) and logs activity
            const lead = await updateLead(
                req.params.id,
                req.body,
                req.user!.id,
                req.user!.role
            );

            res.json({ success: true, data: lead });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
];

/**
 * Handler for assigning a lead to a sales rep (PUT /api/leads/:id/assign)
 * Restricted to MANAGER roles
 */
export const assignLeadHandler = [
    // Enforce RBAC: Only managers can assign leads
    requireRole([Role.MANAGER]),

    async (req: AuthRequest, res: Response) => {
        try {
            // Pass lead ID, assignment data (sales rep ID), and manager ID to service
            // Service validates sales rep and logs activity
            const lead = await assignLead(
                req.params.id, //Lead Id
                req.body,
                req.user!.id //manager Id
            );
            // Return updated lead with new assignee and activity
            res.json({ success: true, data: lead });
        } catch (error: any) {
            // Handle errors (e.g., invalid sales rep ID, lead not found)
            res.status(400).json({ success: false, message: error.message });
        }
    },
];

/**
 * Handler for deleting a lead (DELETE /api/leads/:id)
 * Restricted to MANAGER roles
 */
export const deleteLeadHandler = [
    // Enforce RBAC: Only managers can delete leads
    requireRole([Role.MANAGER]),
    async (req: AuthRequest, res: Response) => {
        try {
            // Pass lead ID, user ID, and role to service (deletes lead + cascades activities)
            await deleteLead(req.params.id, req.user!.id, req.user!.role);
            res.json({ success: true, message: "Lead deleted successfully" });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },
];
