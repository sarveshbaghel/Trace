import { Controller, Get } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';

@Controller('api/v1/complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get('map')
  async getMapComplaints() {
    return this.complaintsService.getMapComplaints();
  }
}
