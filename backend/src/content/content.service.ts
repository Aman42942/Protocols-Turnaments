import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  // Pages
  async getPage(slug: string) {
    return this.prisma.contentPage.findUnique({ where: { slug } });
  }

  async getAllPages() {
    return this.prisma.contentPage.findMany();
  }

  async updatePage(
    slug: string,
    data: { title: string; content: string; isPublished?: boolean },
  ) {
    return this.prisma.contentPage.upsert({
      where: { slug },
      update: data,
      create: { slug, ...data },
    });
  }

  async deletePage(slug: string) {
    return this.prisma.contentPage.delete({ where: { slug } });
  }

  // Announcements
  async getActiveAnnouncements() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    type: string;
  }) {
    return this.prisma.announcement.create({ data });
  }

  async updateAnnouncement(id: string, data: any) {
    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
