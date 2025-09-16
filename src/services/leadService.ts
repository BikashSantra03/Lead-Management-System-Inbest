import prisma from '../config/database';
import { Role, LeadStatus } from '@prisma/client';
import { createLeadSchema, updateLeadSchema, assignLeadSchema } from '../utils/validators';

export const createLead = async (data: z.infer<typeof createLeadSchema>, createdBy: string) => {
  return prisma.lead.create({
    data: { ...data, createdBy, status: LeadStatus.NEW },
    include: { userCreatedBy: { select: { id: true, email: true } } },
  });
};

export const getLeads = async (userId: string, userRole: Role, assignedTo?: string, status?: LeadStatus) => {
  const where: any = {};
  if (userRole === Role.SALES_REP) {
    where.assignedTo = userId;  // Only own leads
  }
  if (assignedTo) where.assignedTo = assignedTo;
  if (status) where.status = status;

  return prisma.lead.findMany({
    where,
    include: { activities: true, userAssignedTo: { select: { id: true, email: true } } },
  });
};

export const updateLead = async (id: string, data: z.infer<typeof updateLeadSchema>, userId: string, userRole: Role) => {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error('Lead not found');

  if (userRole === Role.SALES_REP && lead.assignedTo !== userId) {
    throw new Error('Can only update assigned leads');
  }
  if (userRole === Role.SALES_REP && data.status && ![LeadStatus.ENGAGED, LeadStatus.DISPOSED].includes(data.status)) {
    throw new Error('Can only set Engaged or Disposed');
  }

  // Log activity if status or notes change
  const activityData = data.notes || data.status ? { type: data.status ? 'STATUS_UPDATE' : 'NOTE_ADDED', note: data.notes || `Status: ${data.status}` } : undefined;

  return prisma.lead.update({
    where: { id },
    data,
    include: { activities: true },
  }).then(async (updatedLead) => {
    if (activityData) {
      await prisma.activity.create({
        data: { ...activityData, leadId: id },
      });
      return prisma.lead.findUnique({ where: { id }, include: { activities: true } });
    }
    return updatedLead;
  });
};

export const assignLead = async (id: string, data: z.infer<typeof assignLeadSchema>, createdBy: string) => {
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead || lead.status !== LeadStatus.NEW) throw new Error('Cannot assign non-new lead');

  // Update status and assign
  const updated = await prisma.lead.update({
    where: { id },
    data: { assignedTo: data.assignedTo, status: LeadStatus.ASSIGNED },
  });

  // Log activity
  await prisma.activity.create({
    data: { type: 'ASSIGNMENT', note: `Assigned to user ${data.assignedTo}`, leadId: id },
  });

  return updated;
};

export const deleteLead = async (id: string, userRole: Role) => {
  if (userRole !== Role.MANAGER) throw new Error('Only managers can delete');
  return prisma.lead.delete({ where: { id } });
};

// Engage function for reps (alias for update with status/ notes)
export const engageLead = async (id: string, note: string, userId: string) => {
  return updateLead(id, { status: LeadStatus.ENGAGED, notes: note }, userId, Role.SALES_REP);
};