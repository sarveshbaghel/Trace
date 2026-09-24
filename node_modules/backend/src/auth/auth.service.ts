import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from '../common/firebase/firebase.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService
  ) {}

  async signup(email: string, passwordHash: string, name?: string) {
    this.logger.log(`Signup attempt for email: ${email}`);

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      this.logger.warn(`Signup failed — user already exists: ${email}`);
      throw new ConflictException('User already exists');
    }
    
    // In our schema, phone is required. For now, generate a random phone string if not provided in signup form
    const phone = 'phone-' + Math.random().toString(36).substring(7);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password_hash: passwordHash,
          name: name || email.split('@')[0],
          phone,
          role: 'user'
        }
      });

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload);

      this.logger.log(`Signup successful for user: ${user.id} (${email})`);
      return {
        accessToken,
        user: { id: user.id, email: user.email, name: user.name }
      };
    } catch (error: any) {
      this.logger.error(`Signup failed for ${email}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(email: string, password: string) {
    this.logger.log(`Login attempt for email: ${email}`);

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Login failed — user not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      this.logger.warn(`Login failed — wrong password for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Login successful for user: ${user.id} (${email})`);
    return {
      accessToken,
      user: { id: user.id, email: user.email, name: user.name }
    };
  }

  async googleLogin(firebaseToken: string) {
    this.logger.log(`Google Login attempt`);
    try {
      const decodedToken = await this.firebaseService.verifyIdToken(firebaseToken);
      const email = decodedToken.email;
      
      if (!email) {
        throw new UnauthorizedException('Google token has no email associated');
      }

      let user = await this.prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        this.logger.log(`Creating new user from Google Login: ${email}`);
        // Generate random placeholder password and phone since they aren't provided by Google
        const randomPassword = Math.random().toString(36).substring(2, 15);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);
        const phone = 'google-' + Math.random().toString(36).substring(7);

        user = await this.prisma.user.create({
          data: {
            email,
            password_hash: passwordHash,
            name: decodedToken.name || email.split('@')[0],
            phone,
            role: 'user',
          }
        });
      }

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload);

      this.logger.log(`Google Login successful for user: ${user.id} (${email})`);
      return {
        accessToken,
        user: { id: user.id, email: user.email, name: user.name }
      };
    } catch (error: any) {
      this.logger.error(`Google Login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid Google token');
    }
  }
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        home_city_id: true,
        role: true,
        created_at: true,
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Calculate stats
    const totalReports = await this.prisma.complaint.count({ where: { user_id: userId } });
    const resolvedReports = await this.prisma.complaint.count({ where: { user_id: userId, status: 'resolved' } });

    return {
      ...user,
      stats: {
        totalReports,
        resolvedReports
      }
    };
  }

  async updateProfile(userId: string, data: { name?: string, phone?: string, home_city_id?: string }) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
          home_city_id: data.home_city_id
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          home_city_id: true,
          role: true,
        }
      });
      
      this.logger.log(`Profile updated for user: ${userId}`);
      return updatedUser;
    } catch (error: any) {
      this.logger.error(`Failed to update profile for ${userId}: ${error.message}`);
      throw error;
    }
  }
}
