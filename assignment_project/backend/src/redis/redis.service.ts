/**
 * Redis Service
 * Wraps ioredis for Pub/Sub operations.
 * Uses multiplexed permanent connections for ultra-fast, zero-overhead messaging.
 */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

interface PendingRequest {
  resolve: (val: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private publisher!: Redis;
  private subscriber!: Redis;
  private keepAliveInterval?: ReturnType<typeof setInterval>;
  private pendingRequests = new Map<string, PendingRequest>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url') || 'redis://localhost:6379';

    // Shared connection options for resilient Upstash TLS reconnections
    const sharedOpts = {
      enableReadyCheck: false,
      retryStrategy: (times: number) => Math.min(times * 500, 5000),
      tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    };

    // Publisher: normal retry behaviour
    this.publisher = new Redis(redisUrl, {
      ...sharedOpts,
      maxRetriesPerRequest: 3,
    });

    // Subscriber: maxRetriesPerRequest MUST be null for psubscribe mode
    this.subscriber = new Redis(redisUrl, {
      ...sharedOpts,
      maxRetriesPerRequest: null,
    });

    this.publisher.on('connect', () => this.logger.log('Redis publisher connected'));
    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
      // Subscribe to ai_response:* pattern once for all request-response cycles
      this.subscriber.psubscribe('ai_response:*', (err) => {
        if (err) {
          this.logger.error(`Failed to psubscribe: ${err.message}`);
        } else {
          this.logger.log('Subscribed to ai_response:* pattern');
        }
      });
    });

    this.publisher.on('error', (err) => this.logger.error('Redis publisher error', err.message));
    this.subscriber.on('error', (err) => this.logger.error('Redis subscriber error', err.message));

    // Handle incoming pmessage for ai_response:*
    this.subscriber.on('pmessage', (_pattern: string, channel: string, message: string) => {
      const pending = this.pendingRequests.get(channel);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(channel);
        pending.resolve(message);
      }
    });

    // Start keep-alive ping loop every 4 minutes to prevent Render idle spin-down
    this.startKeepAlivePing();
  }

  private startKeepAlivePing() {
    this.keepAliveInterval = setInterval(async () => {
      try {
        // 1. Publish Redis keep-alive ping (snake_case to match Python Pydantic)
        await this.publisher.publish(
          'ai_request',
          JSON.stringify({ request_id: 'keep-alive-ping', type: 'ping' }),
        );

        // 2. HTTP ping Python service /health if PYTHON_AI_URL is configured
        const pythonUrl = process.env.PYTHON_AI_URL;
        if (pythonUrl && typeof globalThis.fetch === 'function') {
          await globalThis.fetch(`${pythonUrl}/health`).catch(() => null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.debug(`Keep-alive ping: ${msg}`);
      }
    }, 240000);
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    // Clean up any pending timeouts
    for (const [channel, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`Service shutting down, request on ${channel} cancelled`));
    }
    this.pendingRequests.clear();

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
   * Wait for a single message on a channel with timeout.
   * High performance: Uses multiplexed psubscribe pattern without creating new connections.
   */
  async waitForMessage(channel: string, timeoutMs = 60000): Promise<string> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(channel);
        reject(new Error(`Timeout waiting for response on ${channel}`));
      }, timeoutMs);

      this.pendingRequests.set(channel, { resolve, reject, timer });
    });
  }
}
