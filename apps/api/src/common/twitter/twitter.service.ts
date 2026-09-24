import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { TwitterApi } from 'twitter-api-v2';

@Injectable()
export class TwitterService implements OnModuleInit {
  private client: TwitterApi;
  private readonly logger = new Logger(TwitterService.name);
  private isConfigured = false;

  onModuleInit() {
    const appKey = process.env.X_API_KEY || '';
    const appSecret = process.env.X_API_SECRET || '';
    const accessToken = process.env.X_ACCESS_TOKEN || '';
    const accessSecret = process.env.X_ACCESS_SECRET || '';

    // Startup validation — warn if keys are missing
    const missingKeys = [];
    if (!appKey) missingKeys.push('X_API_KEY');
    if (!appSecret) missingKeys.push('X_API_SECRET');
    if (!accessToken) missingKeys.push('X_ACCESS_TOKEN');
    if (!accessSecret) missingKeys.push('X_ACCESS_SECRET');

    if (missingKeys.length > 0) {
      this.logger.warn(`Twitter API keys missing: ${missingKeys.join(', ')}. Tweet posting will be disabled.`);
      this.isConfigured = false;
    } else {
      this.logger.log('Twitter API keys loaded successfully');
      this.isConfigured = true;
    }

    this.client = new TwitterApi({
      appKey,
      appSecret,
      accessToken,
      accessSecret,
    });
  }

  async postTweet(text: string, mediaUrl?: string): Promise<string | null> {
    if (!this.isConfigured) {
      this.logger.warn('Skipping tweet — Twitter API not configured');
      return null;
    }

    try {
      let mediaId;

      if (mediaUrl) {
        // Since we are getting a Firebase Storage URL (or a remote URL),
        // we first need to download the image to a buffer.
        const response = await fetch(mediaUrl);
        const buffer = await response.arrayBuffer();
        
        // Upload the media to Twitter
        mediaId = await this.client.v1.uploadMedia(Buffer.from(buffer), { mimeType: 'image/jpeg' });
      }

      // Post the tweet (API v2)
      const tweetParams: any = { text };
      if (mediaId) {
        tweetParams.media = { media_ids: [mediaId] };
      }

      const tweetResponse = await this.client.v2.tweet(tweetParams);
      this.logger.log(`Successfully posted tweet: ${tweetResponse.data.id}`);
      return tweetResponse.data.id;
    } catch (error: any) {
      this.logger.error(`Failed to post tweet: ${error.message}`, error.stack);
      return null;
    }
  }
}
