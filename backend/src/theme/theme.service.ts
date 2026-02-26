import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_THEME = {
  siteName: 'Protocol Tournaments',
  primaryColor: '#3b82f6',
  secondaryColor: '#1f1f1f',
  accentColor: '#f59e0b',
  backgroundColor: '#020617',
  heroTitle: 'Compete. Win. Become a Legend.',
  heroSubtitle: 'The ultimate esports platform for competitive gamers.',
  isActive: true,
  id: null as string | null,
};

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async getActiveTheme() {
    try {
      const theme = await this.prisma.themeSettings.findFirst({
        where: { isActive: true },
      });

      if (theme) return theme;

      // No row yet — create default
      return await this.prisma.themeSettings.create({
        data: {
          isActive: true,
          siteName: DEFAULT_THEME.siteName,
          primaryColor: DEFAULT_THEME.primaryColor,
          secondaryColor: DEFAULT_THEME.secondaryColor,
          accentColor: DEFAULT_THEME.accentColor,
          backgroundColor: DEFAULT_THEME.backgroundColor,
          heroTitle: DEFAULT_THEME.heroTitle,
          heroSubtitle: DEFAULT_THEME.heroSubtitle,
        },
      });
    } catch {
      // DB table missing or unreachable — return safe in-memory defaults
      return DEFAULT_THEME;
    }
  }

  async updateTheme(data: any) {
    try {
      const currentTheme = await this.getActiveTheme();

      if (!currentTheme.id) {
        // No DB row — create fresh
        return this.prisma.themeSettings.create({
          data: { ...data, isActive: true },
        });
      }

      return this.prisma.themeSettings.update({
        where: { id: currentTheme.id },
        data: { ...data, isActive: true, updatedAt: new Date() },
      });
    } catch {
      return {
        success: false,
        message: 'Theme update failed — DB unavailable',
      };
    }
  }
}
