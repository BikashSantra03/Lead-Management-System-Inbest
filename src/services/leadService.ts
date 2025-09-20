import { LeadStatus, Role, Prisma } from "@prisma/client";
import z from "zod";
import prisma from "../config/database";
import {
    createLeadSchema,
    updateLeadSchema,
    assignLeadSchema,
    getLeadsQuerySchema,
} from "../utils/validators";
import logger from "../utils/logger";

// TypeScript interfaces to ensure type safety for input data, derived from Zod schemas
interface CreateLeadData extends z.infer<typeof createLeadSchema> {}
interface UpdateLeadData extends z.infer<typeof updateLeadSchema> {}
interface AssignLeadData extends z.infer<typeof assignLeadSchema> {}

/**
 * Creates a new lead, typically by a manager
 * @param data
 * @param createdById
 * @returns
 */
export const createLead = async (data: CreateLeadData, createdById: string) => {
    // Validate input data
    try {
        const validatedData = createLeadSchema.parse(data);

        // Create a new lead in the database
        const lead = await prisma.lead.create({
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
        logger.info(`Lead created successfully`, {
            userId: createdById,
            leadId: lead.id,
            data: validatedData,
        });

        return lead;
    } catch (error: any) {
        // Log validation or database errors
        logger.error(`Failed to create lead: ${error.message}`, {
            userId: createdById,
            data,
            error,
        });
        throw error; // Rethrow for controller to handle
    }
};

/**
 * Retrieves a list of leads with role-based filtering
 * @param userId
 * @param role
 * @param query
 * @returns
 */
export const getLeads = async (
    userId: string,
    role: Role,
    query?: z.infer<typeof getLeadsQuerySchema>
) => {
    // Validate query params
    try {
        const validatedQuery = getLeadsQuerySchema.parse(query || {});

        // Build Prisma where clause for filtering leads
        const where: Prisma.LeadWhereInput = {
            // If status query param is provided, filter by it (e.g., ?status=ENGAGED)
            ...(validatedQuery.status && { status: validatedQuery.status }),
        };

        // Restrict sales reps to only see leads assigned to them
        if (role === Role.SALES_REP) {
            where.assignedTo = userId; // Filter by userId in assignedTo field
        }
        // Managers/Admin see all leads; no additional filter needed

        // Fetch leads with role-based filtering
        const leads = await prisma.lead.findMany({
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
        logger.debug(`Retrieved ${leads.length} leads`, {
            userId,
            role,
            query: validatedQuery,
        });

        return leads;
    } catch (error: any) {
        // Log query validation or database errors
        logger.error(`Failed to retrieve leads: ${error.message}`, {
            userId,
            role,
            query,
            error,
        });
        throw error; // Rethrow for controller
    }
};

/**
 * Retrieves a single lead by ID with role-based access check
 * @param id
 * @param userId
 * @param role
 * @returns
 */
export const getLeadById = async (id: string, userId: string, role: Role) => {
    // Build where clause to find lead by ID
    const where: Prisma.LeadWhereInput = { id };

    // For sales reps, ensure they only access leads assigned to them
    if (role === Role.SALES_REP) {
        where.assignedTo = userId;
    }
    // Managers/Admin can access any lead

    try {
        // Fetch the lead with related data
        const lead = await prisma.lead.findFirst({
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
            logger.error(`Failed to retrieve lead ${id}: ${error.message}`, {
                userId,
                role,
                error,
            });
            throw error;
        }

        // Log successful retrieval (verbose, development-only)
        logger.debug(`Retrieved lead ${id}`, {
            userId,
            role,
        });

        return lead;
    } catch (error: any) {
        // Handle Prisma-specific errors (e.g., invalid ID format)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            const errorMsg = "Lead not found or access denied"; // Generic message for invalid ID
            logger.error(`Failed to retrieve lead ${id}: ${errorMsg}`, {
                userId,
                role,
                originalError: error,
            });
            throw new Error(errorMsg);
        }
        // Log and rethrow other errors
        logger.error(`Failed to retrieve lead ${id}: ${error.message}`, {
            userId,
            role,
            error,
        });
        throw error; // Rethrow for controller
    }
};
/**
 * Updates a lead with role-based restrictions and logs activity
 * @param id
 * @param data
 * @param userId
 * @param role
 * @returns
 */
export const updateLead = async (
    id: string,
    data: UpdateLeadData,
    userId: string,
    role: Role
) => {
    try {
        // Validate input data (status, notes)
        const validatedData = updateLeadSchema.parse(data);

        // Verify access to lead (sales reps: only assigned; managers/admin: any)
        const lead = await getLeadById(id, userId, role);

        // Restrict sales reps to only updating status to ENGAGED or DISPOSED
        if (role === Role.SALES_REP) {
            if (
                validatedData.status &&
                !["ENGAGED", "DISPOSED"].includes(validatedData.status)
            ) {
                const error = new Error(
                    "Sales reps can only set status to ENGAGED or DISPOSED"
                );
                logger.error(
                    `Invalid status update attempt for lead ${id}: ${error.message}`,
                    {
                        userId,
                        role,
                        status: validatedData.status,
                    }
                );
                throw error;
            }
        }

        // Determine if status changed and set activity type
        const statusChange =
            validatedData.status && validatedData.status !== lead.status;

        const actionType =
            role === Role.SALES_REP && statusChange ? "ENGAGE" : "UPDATE";

        // Create note for activity (use provided notes or describe status change)
        const note =
            validatedData.notes ||
            (statusChange
                ? `Status updated to ${validatedData.status}`
                : "Notes updated");

        // Use transaction to ensure atomicity of lead update and activity logging
        const updatedLead = await prisma.$transaction(async (tx) => {
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
        logger.info(`Lead ${id} updated successfully`, {
            userId,
            role,
            updates: validatedData,
        });

        return updatedLead;
    } catch (error: any) {
        // Log validation, access, or transaction errors
        logger.error(`Failed to update lead ${id}: ${error.message}`, {
            userId,
            role,
            data,
            error,
        });
        throw error; // Rethrow for controller
    }
};

/**
 * Assigns a lead to a sales rep and logs the activity
 * @param id
 * @param data
 * @param managerId
 * @returns
 */
export const assignLead = async (
    id: string,
    data: AssignLeadData,
    managerId: string
) => {
    try {
        // Validate input (must provide valid sales rep ID)
        const validatedData = assignLeadSchema.parse(data);

        // Verify the target user is a sales rep
        const salesRep = await prisma.user.findUnique({
            where: { id: validatedData.assignedTo },
        });
        if (!salesRep || salesRep.role !== Role.SALES_REP) {
            const error = new Error("Invalid sales rep: Must be a SALES_REP");
            logger.error(
                `Invalid assignment attempt for lead ${id}: ${error.message}`,
                {
                    userId: managerId,
                    assignedTo: validatedData.assignedTo,
                }
            );
            throw error;
        }

        // Verify the lead exists (managers always have access)
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            const error = new Error("Lead not found");
            logger.error(`Lead ${id} not found for assignment`, {
                userId: managerId,
                assignedTo: validatedData.assignedTo,
            });
            throw error;
        }

        // Use transaction to ensure atomicity of assignment and activity logging
        const updatedLead = await prisma.$transaction(async (tx) => {
            // Update the lead with assignee and status
            const updatedLead = await tx.lead.update({
                where: { id },
                data: {
                    assignedTo: validatedData.assignedTo, // Set sales rep ID
                    status: LeadStatus.ASSIGNED, // Update status to ASSIGNED
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
        logger.info(`Lead ${id} assigned successfully`, {
            userId: managerId,
            assignedTo: validatedData.assignedTo,
        });

        return updatedLead;
    } catch (error: any) {
        // Log validation, access, or transaction errors
        logger.error(`Failed to assign lead ${id}: ${error.message}`, {
            userId: managerId,
            data,
            error,
        });
        throw error; // Rethrow for controller
    }
};

/**
 * Deletes a lead (only allowed for Managers)
 * @param id
 * @param userId
 * @param role
 * @returns
 */
export const deleteLead = async (id: string, userId: string, role: Role) => {
    try {
        // Check role-based permission
        if (role !== Role.MANAGER) {
            const error = new Error("Only managers can delete leads");
            logger.error(
                `Unauthorized delete attempt for lead ${id}: ${error.message}`,
                {
                    userId,
                    role,
                }
            );
            throw error;
        }

        // Verify lead exists
        const lead = await prisma.lead.findUnique({ where: { id } });
        if (!lead) {
            const error = new Error("Lead not found");
            logger.error(`Lead ${id} not found for deletion`, {
                userId,
                role,
            });
            throw error;
        }

        // Delete the lead (activities are automatically deleted via cascade)
        await prisma.lead.delete({
            where: { id },
        });

        // Log successful deletion
        logger.info(`Lead ${id} deleted successfully`, {
            userId,
            role,
        });
    } catch (error: any) {
        // Log deletion errors
        logger.error(`Failed to delete lead ${id}: ${error.message}`, {
            userId,
            role,
            error,
        });
        throw error; // Rethrow for controller
    }
};
