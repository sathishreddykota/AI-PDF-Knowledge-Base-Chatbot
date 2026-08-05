/**
 * Redis Service
 * Wraps ioredis for Pub/Sub operations.
 * Uses separate connections for publishing and subscribing (Redis requirement).
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher!: Redis;
  private subscriber!: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';

    this.publisher = new Redis(redisUrl, { maxRetriesPerRequest: 3 });
    this.subscriber = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

    this.publisher.on('connect', () => this.logger.log('Redis publisher connected'));
    this.subscriber.on('connect', () => this.logger.log('Redis subscriber connected'));
    this.publisher.on('error', (err) => this.logger.error('Redis publisher error', err.message));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err.message));
  }

  async onModuleDestroy() {
    await this.publisher?.quit();
    await this.subscriber?.quit();
    this.logger.log('Redis connections closed');
  }

  /**
   * Publish a message to a Redis channel.
   */
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
    this.logger.debug(`Published to ${channel}`);
  }

  /**
   * Subscribe to a channel and call the handler for each message.
   * Returns a cleanup function to unsubscribe.
   */
  async subscribe(
    channel: string,
    handler: (message: string) => void,
  ): Promise<() => void> {
    await this.subscriber.subscribe(channel);

    const messageHandler = (ch: string, msg: string) => {
      if (ch === channel) {
        handler(msg);
      }
    };

    this.subscriber.on('message', messageHandler);

    return () => {
      this.subscriber.unsubscribe(channel);
      this.subscriber.removeListener('message', messageHandler);
    };
  }

  /**
   * Wait for a single message on a channel with timeout.
   * Used for request-response pattern over Pub/Sub.
   */
  async waitForMessage(channel: string, timeoutMs = 30000): Promise<string> {
    const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';

    return new Promise((resolve, reject) => {
      const tempSubscriber = new Redis(redisUrl, { maxRetriesPerRequest: 3 });

      const timer = setTimeout(() => {
        tempSubscriber.unsubscribe(channel);
        tempSubscriber.quit();
        reject(new Error(`Timeout waiting for response on ${channel}`));
      }, timeoutMs);

      tempSubscriber.subscribe(channel, (err) => {
        if (err) {
          clearTimeout(timer);
          tempSubscriber.quit();
          reject(err);
        }
      });

      tempSubscriber.on('message', (ch: string, msg: string) => {
        if (ch === channel) {
          clearTimeout(timer);
          tempSubscriber.unsubscribe(channel);
          tempSubscriber.quit();
          resolve(msg);
        }
      });
    });
  }
}
