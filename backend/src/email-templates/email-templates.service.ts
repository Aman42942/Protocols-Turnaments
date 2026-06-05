import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.emailTemplate.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findOne(key: string) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { key },
    });
    if (!template) {
      throw new NotFoundException(`Template with key ${key} not found`);
    }
    return template;
  }

  async create(data: {
    key: string;
    subject: string;
    body: string;
    description?: string;
    variables?: any;
  }) {
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { key: data.key },
    });
    if (existing) {
      throw new ConflictException(`Template with key ${data.key} already exists`);
    }

    return this.prisma.emailTemplate.create({
      data: {
        ...data,
        variables: data.variables ? JSON.stringify(data.variables) : null,
      },
    });
  }

  async update(key: string, data: {
    subject?: string;
    body?: string;
    description?: string;
    variables?: any;
  }) {
    await this.findOne(key);
    return this.prisma.emailTemplate.update({
      where: { key },
      data: {
        ...data,
        variables: data.variables ? JSON.stringify(data.variables) : null,
      },
    });
  }

  async remove(key: string) {
    await this.findOne(key);
    return this.prisma.emailTemplate.delete({
      where: { key },
    });
  }
}
