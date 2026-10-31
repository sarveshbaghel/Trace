import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';

@Controller('api/v1/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.adminService.login(body.email || '', body.password || '');
  }

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Get('complaints')
  getComplaints(
    @Query('status') status?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getComplaints(status, category);
  }

  @Get('complaints/:id')
  getComplaint(@Param('id') id: string) {
    return this.adminService.getComplaintById(id);
  }

  @Patch('complaints/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('admin_note') adminNote?: string,
  ) {
    return this.adminService.updateStatus(id, status, adminNote);
  }

  @Post('complaints/:id/escalate')
  escalate(@Param('id') id: string) {
    return this.adminService.triggerEscalation(id);
  }

  @Post('complaints/:id/resolve')
  @UseInterceptors(FileInterceptor('image'))
  resolve(
    @Param('id') id: string,
    @Body('resolved_note') note?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.adminService.resolveComplaint(id, note, file);
  }

  @Post('complaints/:id/decline')
  decline(
    @Param('id') id: string,
    @Body('decline_reason') reason: string,
  ) {
    return this.adminService.declineComplaint(id, reason);
  }

  @Post('complaints/:id/post-to-x')
  postToX(@Param('id') id: string) {
    return this.adminService.postToX(id);
  }

  @Get('settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Put('settings')
  updateSettings(@Body() updates: any) {
    return this.adminService.updateSettings(updates);
  }
}