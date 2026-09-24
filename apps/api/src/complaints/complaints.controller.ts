import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ComplaintsService } from './complaints.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get('map')
  async getMapComplaints() {
    return this.complaintsService.getMapComplaints();
  }

  @Get()
  async getUserComplaints(@Request() req: any) {
    let userId = 'guest';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwtService = new JwtService();
        const decoded = jwtService.decode(token) as any;
        if (decoded && decoded.sub) {
          userId = decoded.sub;
        }
      } catch (err) {}
    }

    if (userId === 'guest') {
      console.log('getUserComplaints: user is guest');
      return []; // Guest users have no history
    }

    console.log('getUserComplaints: querying for userId:', userId);
    const complaints = await this.complaintsService.getUserComplaints(userId);
    console.log('getUserComplaints: returning', complaints.length, 'complaints');
    return complaints;
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createComplaint(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    // For now, if no auth token is passed, use a mock or hardcoded user ID.
    // In reality, this should come from a JwtAuthGuard.
    let userId = 'guest';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const jwtService = new JwtService();
        const decoded = jwtService.decode(token) as any;
        if (decoded && decoded.sub) {
          userId = decoded.sub;
        }
      } catch (err) {
        // ignore decoding errors
      }
    }
    
    // If still guest (no token passed or decoding failed), don't pass it to findUnique which expects an ObjectId
    // Passing undefined will let the service create a dummy user
    const effectiveUserId = userId === 'guest' ? undefined : userId;
    
    return this.complaintsService.createComplaint({
      userId: effectiveUserId,
      category: body.category,
      description: body.description,
      latitude: parseFloat(body.latitude),
      longitude: parseFloat(body.longitude),
      address: body.address,
    }, file);
  }
}
