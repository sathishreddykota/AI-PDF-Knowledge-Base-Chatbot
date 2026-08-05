/**
 * Users Service
 * Handles user lookup and admin account seeding on application startup.
 */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

import { User } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Seed the default admin account on first startup.
   */
  async onModuleInit(): Promise<void> {
    const adminEmail =
      this.configService.get<string>('admin.email') || 'admin@admin.com';
    const adminPassword =
      this.configService.get<string>('admin.password') || 'Admin@123';

    const existingAdmin = await this.userModel.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await this.userModel.create({
        email: adminEmail,
        password: hashedPassword,
      });
      this.logger.log(`Admin account seeded: ${adminEmail}`);
    } else {
      this.logger.log(`Admin account already exists: ${adminEmail}`);
    }
  }

  /**
   * Find a user by email address.
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  /**
   * Find a user by their MongoDB ID.
   */
  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }
}
