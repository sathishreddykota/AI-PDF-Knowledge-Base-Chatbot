/**
 * Root Application Module
 * Imports all feature modules and configures MongoDB + environment.
 */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    // Global config from env vars
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
      }),
    }),

    // Feature modules
    RedisModule,
    UsersModule,
    AuthModule,
    DocumentsModule,
    ChatModule,
    DashboardModule,
  ],
})
export class AppModule {}
