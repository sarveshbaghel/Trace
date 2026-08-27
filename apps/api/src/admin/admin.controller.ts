import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('complaints')
  getComplaints(@Query('status') status?: string) {
    return this.adminService.getComplaints(status);
  }

  @Patch('complaints/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateStatus(id, status);
  }

  @Post('complaints/:id/escalate')
  escalate(@Param('id') id: string) {
    return this.adminService.triggerEscalation(id);
  }
}