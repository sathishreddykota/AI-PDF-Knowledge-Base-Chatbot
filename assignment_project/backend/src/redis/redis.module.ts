/**
 * Redis Module
 * Provides RedisService as a global singleton for Pub/Sub operations.
 */
import { Global, Module } from '@nestjs/common';

import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
