import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Dashboard summary metrics based on schema statuses
  async getMetrics() {
    const [total, submitted, inProgress, resolved] = await Promise.all([
      this.prisma.complaint.count(),
      this.prisma.complaint.count({ where: { status: 'SUBMITTED' } }),
      this.prisma.complaint.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    ]);

    return {
      total,
      submitted,
      inProgress,
      resolved,
    };
  }

  // 2. Fetch complaints with User info & AI analysis
  async getComplaints(status?: string) {
    return this.prisma.complaint.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        ai_analysis: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // 3. Update complaint status
  async updateStatus(id: string, status: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return this.prisma.complaint.update({
      where: { id },
      data: { status },
    });
  }

  // 4. Trigger escalation workflow
  async triggerEscalation(id: string) {
    const complaint = await this.prisma.complaint.findUnique({ where: { id } });
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });

    return {
      message: 'Escalation triggered successfully',
      complaint: updated,
      escalatedAt: new Date().toISOString(),
    };
  }
}