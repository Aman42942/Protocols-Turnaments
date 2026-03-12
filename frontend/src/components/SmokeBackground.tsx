"use client";
import React, { useEffect, useRef } from 'react';

interface SmokeBackgroundProps {
    color?: string;
    opacity?: number;
}

export function SmokeBackground({ color = '#3b82f6', opacity = 0.5 }: SmokeBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = 40;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            alpha: number;
            maxLife: number;
            life: number;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 200 + 100;
                this.alpha = 0;
                this.maxLife = Math.random() * 300 + 200;
                this.life = 0;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life++;

                if (this.life < this.maxLife * 0.5) {
                    this.alpha = (this.life / (this.maxLife * 0.5)) * opacity;
                } else {
                    this.alpha = (1 - (this.life / this.maxLife)) * opacity;
                }

                if (this.life >= this.maxLife ||
                    this.x < -this.size || this.x > canvas.width + this.size ||
                    this.y < -this.size || this.y > canvas.height + this.size) {
                    this.reset();
                }
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 200 + 100;
                this.alpha = 0;
                this.maxLife = Math.random() * 300 + 200;
                this.life = 0;
            }

            draw() {
                if (!ctx) return;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);

                // Convert hex to rgb for alpha support
                let r = 59, g = 130, b = 246; // Default blue
                try {
                    if (color.startsWith('#')) {
                        r = parseInt(color.slice(1, 3), 16);
                        g = parseInt(color.slice(3, 5), 16);
                        b = parseInt(color.slice(5, 7), 16);
                    }
                } catch (e) {
                    console.error("Error parsing smoke color", color);
                }

                gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.2})`);
                gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${this.alpha * 0.1})`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [color, opacity]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none -z-5"
            style={{ filter: 'blur(40px)' }}
        />
    );
}
