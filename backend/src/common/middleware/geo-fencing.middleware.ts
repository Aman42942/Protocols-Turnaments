import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RegionControlService } from '../../admin-operations/services/region-control.service';
import { RedisService } from '../../redis/redis.service';
import axios from 'axios';

@Injectable()
export class GeoFencingMiddleware implements NestMiddleware {
  constructor(
    private regionService: RegionControlService,
    private redisService: RedisService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    
    if (ip === '::1' || ip === '127.0.0.1' || !ip) {
      return next();
    }

    const cacheKey = `geo:${ip}`;

    try {
      // 1. Check Redis Cache first
      const cachedData = await this.redisService.get(cacheKey);
      let geoData: any;

      if (cachedData) {
        geoData = JSON.parse(cachedData);
      } else {
        // 2. Fallback to external API
        const { data } = await axios.get(`http://ip-api.com/json/${ip}`, { timeout: 2000 });
        if (data.status === 'success') {
          geoData = { country: data.country, state: data.regionName };
          // Cache for 24 hours (86400 seconds)
          await this.redisService.set(cacheKey, JSON.stringify(geoData), 86400);
        }
      }

      if (geoData) {
        const { country, state } = geoData;

        // Check Country
        const isCountryEnabled = await this.regionService.isRegionEnabled(country);
        if (!isCountryEnabled) {
          throw new ForbiddenException(`Access from your country (${country}) is currently restricted.`);
        }

        // Check State (specifically for India)
        if (country === 'India') {
          const isStateEnabled = await this.regionService.isRegionEnabled(state);
          if (!isStateEnabled) {
            throw new ForbiddenException(`Access from your state (${state}) is currently restricted.`);
          }
        }
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      // If geo-service fails, we usually allow access to avoid blocking users due to API downtime,
      // or we can block by default if you prefer high security.
      console.error('Geo-fencing check failed:', error.message);
    }

    next();
  }
}
