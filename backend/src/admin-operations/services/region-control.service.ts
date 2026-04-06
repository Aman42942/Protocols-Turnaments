import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RegionControlService {
  constructor(private prisma: PrismaService) {}

  async getAllRegions() {
    return this.prisma.regionControl.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async toggleRegion(id: string, isEnabled: boolean) {
    const region = await this.prisma.regionControl.findUnique({
      where: { id },
    });

    if (!region) {
      throw new NotFoundException('Region not found');
    }

    return this.prisma.regionControl.update({
      where: { id },
      data: { isEnabled },
    });
  }

  async addRegion(name: string, type: 'COUNTRY' | 'STATE') {
    return this.prisma.regionControl.upsert({
      where: { name },
      update: { type },
      create: { name, type, isEnabled: true },
    });
  }

  async isRegionEnabled(name: string) {
    const region = await this.prisma.regionControl.findUnique({
      where: { name },
    });
    return region ? region.isEnabled : true; // Default to true if not explicitly controlled
  }

  async seedRegions() {
    const countries = ['India', 'USA', 'UK', 'Canada', 'Bangladesh', 'Pakistan', 'Nepal', 'Sri Lanka'];
    const indianStates = ['Telangana', 'Andhra Pradesh', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh', 'West Bengal'];

    for (const name of countries) {
      await this.prisma.regionControl.upsert({
        where: { name },
        update: {},
        create: { name, type: 'COUNTRY', isEnabled: true }
      });
    }

    for (const name of indianStates) {
      await this.prisma.regionControl.upsert({
        where: { name },
        update: {},
        create: { name, type: 'STATE', isEnabled: true }
      });
    }

    return { message: 'Regions seeded successfully' };
  }
}
