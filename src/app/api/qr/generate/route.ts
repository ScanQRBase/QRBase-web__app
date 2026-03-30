/**
 * QR Code Generation API — QRfy-style artistic QR codes
 * 
 * POST /api/qr/generate  — JSON body
 * GET  /api/qr/generate?data=...&startColor=...&endColor=...
 * 
 * Returns SVG with:
 * - Gradient finder patterns (outlined outer + solid inner)
 * - Diagonal linear gradient on dots (top-left → bottom-right)
 * - Rounded-rectangle logo with white padding
 * - Uniform circular dot pattern
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Types ────────────────────────────────────────────────────────────────────

interface QRGenerateRequest {
    data: string;
    size?: number;
    logoUrl?: string;
    logoSizeRatio?: number;
    startColor?: string;
    endColor?: string;
}

// ── Color Utils ──────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0')).join('');
}

function interpolateColor(c1: string, c2: string, t: number): string {
    const [r1, g1, b1] = hexToRgb(c1);
    const [r2, g2, b2] = hexToRgb(c2);
    return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

function isFinderZone(row: number, col: number, mc: number): boolean {
    if (row <= 7 && col <= 7) return true;
    if (row <= 7 && col >= mc - 8) return true;
    if (row >= mc - 8 && col <= 7) return true;
    return false;
}

function renderQRfyFinder(cx: number, cy: number, ms: number, gradId: string): string {
    const outerW = 7 * ms, outerR = ms * 1.4, strokeW = ms * 1.0;
    const innerW = 3 * ms, innerR = ms * 0.6;
    return `<rect x="${cx - outerW / 2}" y="${cy - outerW / 2}" width="${outerW}" height="${outerW}" rx="${outerR}" fill="none" stroke="url(#${gradId})" stroke-width="${strokeW}"/>
    <rect x="${cx - innerW / 2}" y="${cy - innerW / 2}" width="${innerW}" height="${innerW}" rx="${innerR}" fill="url(#${gradId})"/>`;
}

// ── SVG Generator ────────────────────────────────────────────────────────────

async function generateQRfySvg(opts: QRGenerateRequest): Promise<string> {
    const { data, size = 1024, logoUrl, logoSizeRatio = 0.22, startColor = '#0052FF', endColor = '#4DD9F5' } = opts;
    const margin = 2;

    const qrcodegen = await import('qrcode-generator');
    const qrcodeFactory = qrcodegen.default || qrcodegen;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qr = (qrcodeFactory as any)(0, 'M');
    qr.addData(data);
    qr.make();
    const mc = qr.getModuleCount();

    const total = mc + margin * 2;
    const ms = size / total;
    const dotR = ms * 0.40;
    const logoClearModules = logoUrl ? (mc * logoSizeRatio) / 2 + 1.5 : 0;
    const centerRow = mc / 2, centerCol = mc / 2;

    const defs = `<defs>
        <linearGradient id="finderGradTL" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${startColor}"/><stop offset="100%" stop-color="${endColor}"/></linearGradient>
        <linearGradient id="finderGradTR" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${endColor}"/><stop offset="100%" stop-color="${startColor}"/></linearGradient>
        <linearGradient id="finderGradBL" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${endColor}"/><stop offset="100%" stop-color="${startColor}"/></linearGradient>
    </defs>`;

    let dots = '';
    for (let r = 0; r < mc; r++) {
        for (let c = 0; c < mc; c++) {
            if (isFinderZone(r, c, mc) || !qr.isDark(r, c)) continue;
            const cx = (c + margin + 0.5) * ms;
            const cy = (r + margin + 0.5) * ms;
            if (logoUrl) {
                const dr = Math.abs(r - centerRow), dc = Math.abs(c - centerCol);
                if (dr < logoClearModules && dc < logoClearModules) continue;
            }
            const diagT = (r + c) / (2 * mc);
            const color = interpolateColor(startColor, endColor, diagT);
            dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${dotR.toFixed(1)}" fill="${color}"/>`;
        }
    }

    const finders = [{ r: 3, c: 3, g: 'finderGradTL' }, { r: 3, c: mc - 4, g: 'finderGradTR' }, { r: mc - 4, c: 3, g: 'finderGradBL' }];
    let finderSvg = '';
    for (const f of finders) { finderSvg += renderQRfyFinder((f.c + margin + 0.5) * ms, (f.r + margin + 0.5) * ms, ms, f.g); }

    let logoSvg = '';
    if (logoUrl) {
        const lps = mc * logoSizeRatio * ms, pad = ms * 1.5, bgW = lps + pad * 2, bgR = bgW * 0.15, logoR = lps * 0.12;
        const lx = size / 2 - bgW / 2, imgX = size / 2 - lps / 2;
        logoSvg = `<rect x="${lx.toFixed(1)}" y="${lx.toFixed(1)}" width="${bgW.toFixed(1)}" height="${bgW.toFixed(1)}" rx="${bgR.toFixed(1)}" fill="#FFFFFF"/>
        <defs><clipPath id="logoClip"><rect x="${imgX.toFixed(1)}" y="${imgX.toFixed(1)}" width="${lps.toFixed(1)}" height="${lps.toFixed(1)}" rx="${logoR.toFixed(1)}"/></clipPath></defs>
        <image href="${logoUrl}" x="${imgX.toFixed(1)}" y="${imgX.toFixed(1)}" width="${lps.toFixed(1)}" height="${lps.toFixed(1)}" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${defs}<rect width="${size}" height="${size}" fill="#FFFFFF"/>${finderSvg}${dots}${logoSvg}</svg>`;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as QRGenerateRequest;
        if (!body.data) return NextResponse.json({ error: 'Missing "data" field' }, { status: 400 });
        const svg = await generateQRfySvg(body);
        return new NextResponse(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
    } catch (error) {
        console.error('[QR Generate]', error);
        return NextResponse.json({ error: 'Failed to generate QR code', details: String(error) }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const data = url.searchParams.get('data');
    if (!data) return NextResponse.json({ error: 'Missing "data" param' }, { status: 400 });

    const svg = await generateQRfySvg({
        data,
        size: parseInt(url.searchParams.get('size') || '1024'),
        logoUrl: url.searchParams.get('logoUrl') || undefined,
        logoSizeRatio: parseFloat(url.searchParams.get('logoSize') || '0.22'),
        startColor: url.searchParams.get('startColor') || '#0052FF',
        endColor: url.searchParams.get('endColor') || '#4DD9F5',
    });

    return new NextResponse(svg, { status: 200, headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' } });
}
