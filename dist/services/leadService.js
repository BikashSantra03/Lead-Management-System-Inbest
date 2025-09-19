"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLead = exports.assignLead = exports.updateLead = exports.getLeadById = exports.getLeads = exports.createLead = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../config/database"));
const validators_1 = require("../utils/validators");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Creates a new lead, typically by a manager
 * @param data
 * @param createdById
 * @returns
 */
const createLead = async (data, createdById) => {
    // Validate input data
    try {
        const validatedData = validators_1.createLeadSchema.parse(data);
        // Create a new lead in the database
        const lead = await database_1.default.lead.create({
            data: {
                ...validatedData,
                createdBy: createdById, // (Manager ID)
                updatedBy: createdById, // initial updater (same as creator)
                // status defaults to NEW in schema
            },
            include: {
                userCreatedBy: {
                    select: { id: true, name: true, email: true, role: true },
                },
                userAssignedTo: true, // Initially null (no assignee)
            },
        });
        // Log successful lead creation
        logger_1.default.info(`Lead created successfully`, {
            userId: createdById,
            leadId: lead.id,
            data: validatedData,
        });
        return lead;
    }
    catch (error) {
        // Log validation or database errors
        logger_1.default.error(`Failed to create lead: ${error.message}`, {
            userId: createdById,
            data,
            error,
        });
        throw error; // Rethrow for controller to handle
    }
};
exports.createLead = createLead;
/**
 * Retrieves a list of leads with role-based filtering
 * @param userId
 * @param role
 * @param query
 * @returns
 */
const getLeads = async (userId, role, query) => {
    // Validate query params
    try {
        const validatedQuery = validators_1.getLeadsQuerySchema.parse(query || {});
        // Build Prisma where clause for filtering leads
        const where = {
            // If status query param is provided, filter by it (e.g., ?status=ENGAGED)
            ...(validatedQuery.status && { status: validatedQuery.status }),
        };
        // Restrict sales reps to only see leads assigned to them
        if (role === client_1.Role.SALES_REP) {
            where.assignedTo = userId; // Filter by userId in assignedTo field
        }
        // Managers/Admin see all leads; no additional filter needed
        // Fetch leads with role-based filtering
        const leads = await database_1.default.lead.findMany({
            where,
            orderBy: { createdAt: "desc" }, // Sort by creation date (newest first)
            include: {
                userAssignedTo: {
                    select: { id: true, name: true, email: true },
                },
                userCreatedBy: {
                    select: { id: true, name: true, email: true },
                },
                activities: {
                    orderBy: { timestamp: "desc" },
                    include: {
                        user: { select: { id: true, name: true, role: true } },
                    },
                },
            },
        });
        // Log successful retrieval (verbose, development-only)
        logger_1.default.debug(`Retrieved ${leads.length} leads`, {
            userId,
            role,
            query: validatedQuery,
        });
        return leads;
    }
    catch (error) {
        // Log query validation or database errors
        logger_1.default.error(`Failed to retrieve leads: ${error.message}`, {
            userId,
            role,
            query,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.getLeads = getLeads;
/**
 * Retrieves a single lead by ID with role-based access check
 * @param id
 * @param userId
 * @param role
 * @returns
 */
const getLeadById = async (id, userId, role) => {
    // Build where clause to find lead by ID
    const where = { id };
    // For sales reps, ensure they only access leads assigned to them
    if (role === client_1.Role.SALES_REP) {
        where.assignedTo = userId;
    }
    // Managers/Admin can access any lead
    try {
        // Fetch the lead with related data
        const lead = await database_1.default.lead.findFirst({
            where,
            include: {
                userAssignedTo: {
                    select: { id: true, name: true, email: true },
                }, // Assignee
                userCreatedBy: {
                    select: { id: true, name: true, email: true },
                }, // Creator
                userUpdatedBy: {
                    select: { id: true, name: true, email: true },
                }, // Last updater
                activities: {
                    orderBy: { timestamp: "desc" },
                    include: {
                        user: { select: { id: true, name: true, role: true } },
                    },
                },
            },
        });
        // If lead not found or user lacks access, throw error
        if (!lead) {
            const error = new Error("Lead not found or access denied");
            logger_1.default.error(`Failed to retrieve lead ${id}: ${error.message}`, {
                userId,
                role,
                error,
            });
            throw error;
        }
        // Log successful retrieval (verbose, development-only)
        logger_1.default.debug(`Retrieved lead ${id}`, {
            userId,
            role,
        });
        return lead;
    }
    catch (error) {
        // Log access or database errors
        logger_1.default.error(`Failed to retrieve lead ${id}: ${error.message}`, {
            userId,
            role,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.getLeadById = getLeadById;
/**
 * Updates a lead with role-based restrictions and logs activity
 * @param id
 * @param data
 * @param userId
 * @param role
 * @returns
 */
const updateLead = async (id, data, userId, role) => {
    try {
        // Validate input data (status, notes)
        const validatedData = validators_1.updateLeadSchema.parse(data);
        // Verify access to lead (sales reps: only assigned; managers/admin: any)
        const lead = await (0, exports.getLeadById)(id, userId, role);
        // Restrict sales reps to only updating status to ENGAGED or DISPOSED
        if (role === client_1.Role.SALES_REP) {
            if (validatedData.status &&
                !["ENGAGED", "DISPOSED"].includes(validatedData.status)) {
                const error = new Error("Sales reps can only set status to ENGAGED or DISPOSED");
                logger_1.default.error(`Invalid status update attempt for lead ${id}: ${error.message}`, {
                    userId,
                    role,
                    status: validatedData.status,
                });
                throw error;
            }
        }
        // Determine if status changed and set activity type
        const statusChange = validatedData.status && validatedData.status !== lead.status;
        const actionType = role === client_1.Role.SALES_REP && statusChange ? "ENGAGE" : "UPDATE";
        // Create note for activity (use provided notes or describe status change)
        const note = validatedData.notes ||
            (statusChange
                ? `Status updated to ${validatedData.status}`
                : "Notes updated");
        // Use transaction to ensure atomicity of lead update and activity logging
        const updatedLead = await database_1.default.$transaction(async (tx) => {
            // Update the lead
            const updatedLead = await tx.lead.update({
                where: { id },
                data: {
                    ...validatedData,
                    updatedBy: userId,
                    ...(validatedData.status && {
                        status: validatedData.status,
                    }), // Only update status if provided
                },
                include: {
                    userAssignedTo: {
                        select: { id: true, name: true, email: true },
                    },
                    userCreatedBy: {
                        select: { id: true, name: true, email: true },
                    },
                    userUpdatedBy: true,
                    activities: {
                        orderBy: { timestamp: "desc" },
                        include: {
                            user: {
                                select: { id: true, name: true, role: true },
                            },
                        },
                    },
                },
            });
            // Log the activity in the same transaction
            await tx.activity.create({
                data: {
                    leadId: id,
                    type: actionType, // ENGAGE for sales rep status change, UPDATE otherwise
                    note,
                    performedBy: userId,
                },
            });
            return updatedLead;
        });
        // Log successful update
        logger_1.default.info(`Lead ${id} updated successfully`, {
            userId,
            role,
            updates: validatedData,
        });
        return updatedLead;
    }
    catch (error) {
        // Log validation, access, or transaction errors
        logger_1.default.error(`Failed to update lead ${id}: ${error.message}`, {
            userId,
            role,
            data,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.updateLead = updateLead;
/**
 * Assigns a lead to a sales rep and logs the activity
 * @param id
 * @param data
 * @param managerId
 * @returns
 */
const assignLead = async (id, data, managerId) => {
    try {
        // Validate input (must provide valid sales rep ID)
        const validatedData = validators_1.assignLeadSchema.parse(data);
        // Verify the target user is a sales rep
        const salesRep = await database_1.default.user.findUnique({
            where: { id: validatedData.assignedTo },
        });
        if (!salesRep || salesRep.role !== client_1.Role.SALES_REP) {
            const error = new Error("Invalid sales rep: Must be a SALES_REP");
            logger_1.default.error(`Invalid assignment attempt for lead ${id}: ${error.message}`, {
                userId: managerId,
                assignedTo: validatedData.assignedTo,
            });
            throw error;
        }
        // Verify the lead exists (managers always have access)
        const lead = await database_1.default.lead.findUnique({ where: { id } });
        if (!lead) {
            const error = new Error("Lead not found");
            logger_1.default.error(`Lead ${id} not found for assignment`, {
                userId: managerId,
                assignedTo: validatedData.assignedTo,
            });
            throw error;
        }
        // Use transaction to ensure atomicity of assignment and activity logging
        const updatedLead = await database_1.default.$transaction(async (tx) => {
            // Update the lead with assignee and status
            const updatedLead = await tx.lead.update({
                where: { id },
                data: {
                    assignedTo: validatedData.assignedTo, // Set sales rep ID
                    status: client_1.LeadStatus.ASSIGNED, // Update status to ASSIGNED
                    updatedBy: managerId, // Track manager as updater
                },
                include: {
                    userAssignedTo: {
                        select: { id: true, name: true, email: true },
                    },
                    userCreatedBy: {
                        select: { id: true, name: true, email: true },
                    },
                    userUpdatedBy: true,
                    activities: {
                        orderBy: { timestamp: "desc" },
                        include: {
                            user: {
                                select: { id: true, name: true, role: true },
                            },
                        },
                    },
                },
            });
            // Log the assignment activity
            await tx.activity.create({
                data: {
                    leadId: id,
                    type: "ASSIGNMENT",
                    note: `Assigned to ${salesRep.name} (${salesRep.email}) by manager`,
                    performedBy: managerId, // Track manager who assigned
                },
            });
            return updatedLead;
        });
        // Log successful assignment
        logger_1.default.info(`Lead ${id} assigned successfully`, {
            userId: managerId,
            assignedTo: validatedData.assignedTo,
        });
        return updatedLead;
    }
    catch (error) {
        // Log validation, access, or transaction errors
        logger_1.default.error(`Failed to assign lead ${id}: ${error.message}`, {
            userId: managerId,
            data,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.assignLead = assignLead;
/**
 * Deletes a lead (only allowed for Managers)
 * @param id
 * @param userId
 * @param role
 * @returns
 */
const deleteLead = async (id, userId, role) => {
    try {
        // Check role-based permission
        if (role !== client_1.Role.MANAGER) {
            const error = new Error("Only managers can delete leads");
            logger_1.default.error(`Unauthorized delete attempt for lead ${id}: ${error.message}`, {
                userId,
                role,
            });
            throw error;
        }
        // Verify lead exists
        const lead = await database_1.default.lead.findUnique({ where: { id } });
        if (!lead) {
            const error = new Error("Lead not found");
            logger_1.default.error(`Lead ${id} not found for deletion`, {
                userId,
                role,
            });
            throw error;
        }
        // Delete the lead (activities are automatically deleted via cascade)
        await database_1.default.lead.delete({
            where: { id },
        });
        // Log successful deletion
        logger_1.default.info(`Lead ${id} deleted successfully`, {
            userId,
            role,
        });
    }
    catch (error) {
        // Log deletion errors
        logger_1.default.error(`Failed to delete lead ${id}: ${error.message}`, {
            userId,
            role,
            error,
        });
        throw error; // Rethrow for controller
    }
};
exports.deleteLead = deleteLead;
