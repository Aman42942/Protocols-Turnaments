import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private prisma: PrismaService) {}

  async getActiveTheme() {
    // Try to find existing theme
    const theme = await this.prisma.themeSettings.findFirst({
      where: { isActive: true },
    });

    if (theme) return theme;

    // If no theme exists, create default
    return this.prisma.themeSettings.create({
      data: {
        isActive: true,
        siteName: 'Pro Tournaments',
        primaryColor: '#3b82f6',
        secondaryColor: '#1f1f1f',
        accentColor: '#3b82f6',
        backgroundColor: '#000000',
        heroTitle: 'Dominate the Arena',
        heroSubtitle:
          'Join the ultimate esports tournaments and win big prizes.',
      },
    });
  }

  async updateTheme(data: any) {
    // Get the ID of the active theme (or create one if missing)
    const currentTheme = await this.getActiveTheme();

    return this.prisma.themeSettings.update({
      where: { id: currentTheme.id },
      data: {
        ...data,
        // Ensure these fields aren't accidentally wiped if not provided
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }
}
