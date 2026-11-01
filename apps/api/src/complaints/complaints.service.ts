import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwitterService } from '../common/twitter/twitter.service';
import { FirebaseService } from '../common/firebase/firebase.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ComplaintsService {
  private logger = new Logger(ComplaintsService.name);
  private memoryComplaints: any[] = [
    {
      id: 'cmp_demo_1',
      user_id: 'system_demo',
      category: 'Pothole',
      description: 'Major road crater on M.G. Road causing traffic bottlenecks.',
      image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600',
      latitude: 26.2183,
      longitude: 78.1828,
      address: 'MG Road, near Metro Pillar 142, Gwalior',
      status: 'SUBMITTED',
      created_at: new Date(Date.now() - 3600000 * 2),
    },
    {
      id: 'cmp_demo_2',
      user_id: 'system_demo',
      category: 'Garbage',
      description: 'Community garbage dumpster spilling onto walkway.',
      image_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600',
      latitude: 26.2245,
      longitude: 78.1795,
      address: 'Sector 4 Market Lane, Gwalior',
      status: 'IN_PROGRESS',
      created_at: new Date(Date.now() - 3600000 * 12),
    },
    {
      id: 'cmp_demo_3',
      user_id: 'system_demo',
      category: 'Streetlight',
      description: 'Dark junction with broken street poles.',
      image_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600',
      latitude: 26.2112,
      longitude: 78.1915,
      address: 'Ring Road Bypass, Gwalior',
      status: 'RESOLVED',
      created_at: new Date(Date.now() - 3600000 * 24),
    },
  ];

  constructor(
    private prisma: PrismaService,
    private twitterService: TwitterService,
    private firebaseService: FirebaseService
  ) {}

  getAllMemoryComplaints() {
    return this.memoryComplaints;
  }

  async getMapComplaints() {
    try {
      const results = await this.prisma.complaint.findMany({
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
      if (results && results.length > 0) return results;
    } catch (err) {
      this.logger.warn(`Database unavailable in getMapComplaints, using fallback dataset`);
    }

    return this.memoryComplaints.map(c => ({
      id: c.id,
      category: c.category,
      latitude: c.latitude,
      longitude: c.longitude,
      address: c.address,
      status: c.status,
      created_at: c.created_at,
    }));
  }

  async getUserComplaints(userId: string) {
    try {
      const results = await this.prisma.complaint.findMany({
        where: {
          user_id: userId,
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          category: true,
          description: true,
          image_url: true,
          latitude: true,
          longitude: true,
          address: true,
          status: true,
          created_at: true,
        },
      });
      return results;
    } catch (err) {
      this.logger.warn(`Database unavailable in getUserComplaints, using fallback dataset`);
    }

    // Return user's complaints, or demo ones if user has none yet
    const userItems = this.memoryComplaints.filter(c => c.user_id === userId);
    if (userItems.length > 0) {
      return userItems;
    }
    return this.memoryComplaints;
  }

  async createComplaint(data: any, file?: Express.Multer.File) {
    let imageUrl = '';

    if (file && file.buffer) {
      try {
        imageUrl = await this.firebaseService.uploadImage(file.buffer, file.originalname, file.mimetype);
      } catch (err: any) {
        this.logger.warn(`Firebase image upload skipped or failed (${err?.message}), saving to local storage`);
        try {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const ext = path.extname(file.originalname || '.jpg') || '.jpg';
          const filename = `complaint_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`;
          const filePath = path.join(uploadsDir, filename);
          fs.writeFileSync(filePath, file.buffer);
          imageUrl = `/uploads/${filename}`;
          this.logger.log(`Image saved locally at ${imageUrl}`);
        } catch (saveErr) {
          this.logger.error('Failed to save file locally:', saveErr);
        }
      }
    }

    // Try DB first
    try {
      let user = data.userId ? await this.prisma.user.findUnique({ where: { id: data.userId } }).catch(() => null) : null;
      if (!user) {
        user = await this.prisma.user.findFirst().catch(() => null);
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email: 'guest@trace.com',
              name: 'Guest User',
              phone: '1234567890',
              password_hash: 'dummy',
              role: 'guest',
            },
          }).catch(() => null);
        }
      }

      if (user) {
        const complaint = await this.prisma.complaint.create({
          data: {
            user_id: user.id,
            category: data.category,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address || 'Unknown Location',
            image_url: imageUrl,
          },
        });

        // Fire and forget tweet post with structured format: Issue -> Date & Time -> Location -> Image -> Tags
        const dateStr = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const locStr = data.address || (data.latitude && data.longitude ? `${Number(data.latitude).toFixed(4)}, ${Number(data.longitude).toFixed(4)}` : 'Reported Location');
        const tweetText = `🚨 Issue: ${data.category}\n📅 Date: ${dateStr}\n📍 Location: ${locStr}\n\n#TraceApp #CivicAction #CivicIssue`;
        this.twitterService.postTweet(tweetText, imageUrl).catch(() => null);

        return complaint;
      }
    } catch (err) {
      this.logger.warn(`Database unavailable in createComplaint, creating in memory store`);
    }

    // Fallback in-memory
    const newComplaint = {
      id: 'cmp_' + Date.now(),
      user_id: data.userId || 'guest_user',
      category: data.category,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address || 'Unknown Location',
      image_url: imageUrl || '',
      status: 'SUBMITTED',
      created_at: new Date(),
    };

    this.memoryComplaints.unshift(newComplaint);
    return newComplaint;
  }
}
