import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { EmailTemplatesService } from './email-templates.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('email-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class EmailTemplatesController {
  constructor(private readonly templatesService: EmailTemplatesService) {}

  @Get()
  async findAll() {
    return this.templatesService.findAll();
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.templatesService.findOne(key);
  }

  @Post()
  async create(@Body() data: any) {
    return this.templatesService.create(data);
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() data: any) {
    return this.templatesService.update(key, data);
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    return this.templatesService.remove(key);
  }

  @Post('preview')
  async preview(@Body() data: { body: string; variables: any }) {
    if (!data.body) throw new BadRequestException('Body is required for preview');
    
    let rendered = data.body;
    const vars = data.variables || {};
    
    // Simple placeholder replacement logic for preview
    Object.keys(vars).forEach(key => {
      const value = vars[key];
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return { rendered };
  }
}
