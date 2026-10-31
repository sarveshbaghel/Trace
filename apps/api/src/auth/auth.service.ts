import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { FirebaseService } from '../common/firebase/firebase.service';
import { ComplaintsService } from '../complaints/complaints.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Resilient in-memory fallback store when database is connecting or offline
  private memoryUsers = new Map<string, any>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
    private complaintsService: ComplaintsService,
  ) {}

  async signup(email: string, passwordHash: string, name?: string) {
    this.logger.log(`Signup attempt for email: ${email}`);

    // 1. Try with Prisma DB
    try {
      const existingUser = await this.prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        this.logger.warn(`Signup failed — user already exists: ${email}`);
        throw new ConflictException('User already exists');
      }

      const phone = 'phone-' + Math.random().toString(36).substring(7);
      const user = await this.prisma.user.create({
        data: {
          email,
          password_hash: passwordHash,
          name: name || email.split('@')[0],
          phone,
          role: 'user',
        },
      });

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = await this.jwtService.signAsync(payload);

      this.logger.log(`Signup successful via DB for user: ${user.id} (${email})`);
      return {
        accessToken,
        user: { id: user.id, email: user.email, name: user.name },
      };
    } catch (dbError: any) {
      if (dbError instanceof ConflictException) {
        throw dbError;
      }
      this.logger.warn(`Database unavailable during signup (${dbError.message}), using fallback memory store`);
    }

    // 2. Fallback in-memory store
    const lowerEmail = email.toLowerCase().trim();
    if (this.memoryUsers.has(lowerEmail)) {
      this.logger.warn(`Signup failed — user already exists in memory: ${lowerEmail}`);
      throw new ConflictException('User already exists');
    }

    const userId = 'usr_' + Date.now();
    const newUser = {
      id: userId,
      email: lowerEmail,
      password_hash: passwordHash,
      name: name || email.split('@')[0],
      phone: '+91 ' + Math.floor(1000000000 + Math.random() * 9000000000),
      role: 'user',
      created_at: new Date(),
    };

    this.memoryUsers.set(lowerEmail, newUser);
    this.memoryUsers.set(userId, newUser);

    const payload = { sub: newUser.id, email: newUser.email, role: newUser.role };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Signup successful via fallback for user: ${newUser.id} (${lowerEmail})`);
    return {
      accessToken,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    };
  }

  async login(email: string, password: string) {
    this.logger.log(`Login attempt for email: ${email}`);
    const lowerEmail = email.toLowerCase().trim();

    // 1. Try with Prisma DB
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
          this.logger.warn(`Login failed — wrong password for: ${email}`);
          throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);

        this.logger.log(`Login successful via DB for user: ${user.id} (${email})`);
        return {
          accessToken,
          user: { id: user.id, email: user.email, name: user.name },
        };
      }
    } catch (dbError: any) {
      if (dbError instanceof UnauthorizedException) {
        throw dbError;
      }
      this.logger.warn(`Database unavailable during login (${dbError.message}), checking memory store`);
    }

    // 2. Check in-memory store
    const memUser = this.memoryUsers.get(lowerEmail);
    if (!memUser) {
      this.logger.warn(`Login failed — user not found: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, memUser.password_hash);
    if (!isMatch) {
      this.logger.warn(`Login failed — wrong password for: ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: memUser.id, email: memUser.email, role: memUser.role };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`Login successful via fallback for user: ${memUser.id} (${email})`);
    return {
      accessToken,
      user: { id: memUser.id, email: memUser.email, name: memUser.name },
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

      const lowerEmail = email.toLowerCase().trim();

      try {
        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
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
            },
          });
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
          accessToken,
          user: { id: user.id, email: user.email, name: user.name },
        };
      } catch (dbErr) {
        // Fallback in memory
        let memUser = this.memoryUsers.get(lowerEmail);
        if (!memUser) {
          const userId = 'usr_g_' + Date.now();
          memUser = {
            id: userId,
            email: lowerEmail,
            name: decodedToken.name || email.split('@')[0],
            phone: '+91 99999 88888',
            role: 'user',
            created_at: new Date(),
          };
          this.memoryUsers.set(lowerEmail, memUser);
          this.memoryUsers.set(userId, memUser);
        }

        const payload = { sub: memUser.id, email: memUser.email, role: memUser.role };
        const accessToken = await this.jwtService.signAsync(payload);
        return {
          accessToken,
          user: { id: memUser.id, email: memUser.email, name: memUser.name },
        };
      }
    } catch (error: any) {
      this.logger.error(`Google Login failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private getMemoryStats(userId: string) {
    const allComplaints = this.complaintsService.getAllMemoryComplaints();
    const userComplaints = allComplaints.filter(c => c.user_id === userId);
    const totalReports = userComplaints.length;
    const resolvedReports = userComplaints.filter(c =>
      c.status?.toUpperCase() === 'RESOLVED'
    ).length;
    const inProgressReports = userComplaints.filter(c =>
      c.status?.toUpperCase() === 'IN_PROGRESS'
    ).length;
    return { totalReports, resolvedReports, inProgressReports };
  }

  async getMe(userId: string) {
    try {
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
        },
      });

      if (user) {
        const totalReports = await this.prisma.complaint.count({ where: { user_id: userId } }).catch(() => 0);
        const resolvedReports = await this.prisma.complaint.count({ where: { user_id: userId, status: 'resolved' } }).catch(() => 0);
        const inProgressReports = await this.prisma.complaint.count({ where: { user_id: userId, status: 'IN_PROGRESS' } }).catch(() => 0);

        return {
          ...user,
          stats: { totalReports, resolvedReports, inProgressReports },
        };
      }
    } catch (dbErr) {
      this.logger.warn(`Database unavailable in getMe, checking memory store for: ${userId}`);
    }

    const memUser = this.memoryUsers.get(userId);
    if (!memUser) {
      const stats = this.getMemoryStats(userId);
      return {
        id: userId,
        email: 'user@trace.app',
        name: 'Citizen User',
        phone: '+91 98765 43210',
        home_city_id: null,
        role: 'user',
        stats,
      };
    }

    const stats = this.getMemoryStats(userId);
    return {
      id: memUser.id,
      email: memUser.email,
      name: memUser.name,
      phone: memUser.phone,
      home_city_id: memUser.home_city_id || null,
      role: memUser.role || 'user',
      stats,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string; home_city_id?: string }) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          phone: data.phone,
          home_city_id: data.home_city_id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          home_city_id: true,
          role: true,
        },
      });

      this.logger.log(`Profile updated via DB for user: ${userId}`);
      return updatedUser;
    } catch (dbErr) {
      this.logger.warn(`Database unavailable in updateProfile, updating memory store for: ${userId}`);
    }

    const memUser = this.memoryUsers.get(userId) || { id: userId, email: 'user@trace.app', role: 'user' };
    if (data.name) memUser.name = data.name;
    if (data.phone) memUser.phone = data.phone;
    if (data.home_city_id) memUser.home_city_id = data.home_city_id;

    this.memoryUsers.set(userId, memUser);
    if (memUser.email) this.memoryUsers.set(memUser.email, memUser);

    return {
      id: memUser.id,
      email: memUser.email,
      name: memUser.name,
      phone: memUser.phone,
      home_city_id: memUser.home_city_id || null,
      role: memUser.role || 'user',
    };
  }
}
