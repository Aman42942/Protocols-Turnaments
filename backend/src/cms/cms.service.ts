import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
    private readonly logger = new Logger(CmsService.name);

    constructor(private prisma: PrismaService) { }

    // ==========================================
    // GLOBAL THEME
    // ==========================================

    async getGlobalTheme() {
        let theme = await (this.prisma as any).globalTheme.findFirst();
        if (!theme) {
            theme = await (this.prisma as any).globalTheme.create({
                data: {
                    mode: 'DARK',
                    primaryColor: '#FF5733',
                    secondaryColor: '#1F1F1F',
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    fontFamily: 'Inter',
                    borderRounding: '0.5rem',
                    animationSpeed: 'normal',
                    buttonStyle: 'solid',
                    glassmorphism: false,
                    backgroundStyle: 'solid',
                },
            });
        }
        return theme;
    }

    async updateGlobalTheme(data: any) {
        const theme = await this.getGlobalTheme();
        return (this.prisma as any).globalTheme.update({
            where: { id: theme.id },
            data: {
                mode: data.mode,
                primaryColor: data.primaryColor,
                secondaryColor: data.secondaryColor,
                backgroundColor: data.backgroundColor,
                textColor: data.textColor,
                fontFamily: data.fontFamily,
                borderRounding: data.borderRounding,
                animationSpeed: data.animationSpeed,
                buttonStyle: data.buttonStyle,
                glassmorphism: data.glassmorphism,
                backgroundStyle: data.backgroundStyle,
            },
        });
    }

    // ==========================================
    // SITE CONTENT
    // ==========================================

    async getAllContent() {
        const contentList = await (this.prisma as any).siteContent.findMany();
        // Transform array to key-value object for easier frontend consumption
        return contentList.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
    }

    async setContent(key: string, value: string, type: string = 'TEXT') {
        return (this.prisma as any).siteContent.upsert({
            where: { key },
            update: { value, type },
            create: { key, value, type },
        });
    }

    async setMultipleContent(items: { key: string; value: string; type?: string }[]) {
        // Upsert multiple
        const results: any[] = [];
        for (const item of items) {
            results.push(
                await (this.prisma as any).siteContent.upsert({
                    where: { key: item.key },
                    update: { value: item.value, type: item.type || 'TEXT' },
                    create: { key: item.key, value: item.value, type: item.type || 'TEXT' },
                })
            );
        }
        return results;
    }

    // ==========================================
    // COMPONENT LAYOUT
    // ==========================================

    async getAllLayouts() {
        return (this.prisma as any).componentLayout.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }

    async setLayout(componentId: string, isVisible: boolean, displayOrder: number) {
        return (this.prisma as any).componentLayout.upsert({
            where: { componentId },
            update: { isVisible, displayOrder },
            create: { componentId, isVisible, displayOrder },
        });
    }

    // ==========================================
    // CUSTOM FEATURES
    // ==========================================

    async getAllFeatures(onlyActive = false) {
        if (onlyActive) {
            return (this.prisma as any).customFeature.findMany({
                where: { isActive: true },
                orderBy: { order: 'asc' },
            });
        }
        return (this.prisma as any).customFeature.findMany({
            orderBy: { order: 'asc' },
        });
    }

    async createFeature(data: any) {
        return (this.prisma as any).customFeature.create({ data });
    }

    async updateFeature(id: string, data: any) {
        return (this.prisma as any).customFeature.update({
            where: { id },
            data,
        });
    }

    async deleteFeature(id: string) {
        return (this.prisma as any).customFeature.delete({
            where: { id },
        });
    }

    // ==========================================
    // AD SLIDES
    // ==========================================

    async getAllAdSlides(onlyActive = false) {
        const now = new Date();
        if (onlyActive) {
            return (this.prisma as any).adSlide.findMany({
                where: {
                    isActive: true,
                    AND: [
                        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
                        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
                    ],
                },
                orderBy: { displayOrder: 'asc' },
            });
        }
        return (this.prisma as any).adSlide.findMany({
            orderBy: { displayOrder: 'asc' },
        });
    }

    async createAdSlide(data: any) {
        return (this.prisma as any).adSlide.create({ data });
    }

    async updateAdSlide(id: string, data: any) {
        return (this.prisma as any).adSlide.update({
            where: { id },
            data,
        });
    }

    async deleteAdSlide(id: string) {
        return (this.prisma as any).adSlide.delete({
            where: { id },
        });
    }
}
