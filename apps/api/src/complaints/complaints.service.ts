import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwitterService } from '../common/twitter/twitter.service';
import { FirebaseService } from '../common/firebase/firebase.service';

@Injectable()
export class ComplaintsService {
  private logger = new Logger(ComplaintsService.name);

  constructor(
    private prisma: PrismaService,
    private twitterService: TwitterService,
    private firebaseService: FirebaseService
  ) {}

  async getMapComplaints() {
    return this.prisma.complaint.findMany({
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

  async getUserComplaints(userId: string) {
    return this.prisma.complaint.findMany({
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
  }

  async createComplaint(data: any, file?: Express.Multer.File) {
    let imageUrl = '';
    
    // Check if the user exists, otherwise create a dummy one for the MVP
    let user = data.userId ? await this.prisma.user.findUnique({ where: { id: data.userId } }) : null;
    if (!user) {
      user = await this.prisma.user.findFirst();
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: 'guest@trace.com',
            name: 'Guest User',
            phone: '1234567890',
            password_hash: 'dummy',
            role: 'guest'
          }
        });
      }
      data.userId = user.id;
    }

    if (file) {
      try {
        imageUrl = await this.firebaseService.uploadImage(file.buffer, file.originalname, file.mimetype);
      } catch (err) {
        this.logger.error('Failed to upload image to Firebase', err);
      }
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        user_id: data.userId,
        category: data.category,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address || 'Unknown Location',
        image_url: imageUrl,
      }
    });

    // Fire and forget tweet post
    const tweetText = `New ${data.category} reported at ${data.address || 'a location'}! #TraceApp #CivicIssue`;
    this.twitterService.postTweet(tweetText, imageUrl).then(async (tweetId) => {
      if (tweetId) {
        await this.prisma.post.create({
          data: {
            complaint_id: complaint.id,
            tweet_id: tweetId,
            posted_at: new Date(),
            post_status: 'posted'
          }
        });
      }
    });

    return complaint;
  }
}
