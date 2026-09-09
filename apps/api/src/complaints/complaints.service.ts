import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async getMapComplaints() {
    return this.prisma.complaint.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        status: true,
        created_at: true,
      },
    });
  }
}
