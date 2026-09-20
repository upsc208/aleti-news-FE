/** 보드 내용을 오프스크린 canvas에 그려 WebGL 보드(LedRing)의 텍스처로 만든다. 좌표는 텍스처 픽셀이다. */

import {
  ATLETI_NAVY,
  BOARD_BLUE,
  BOARD_GREEN,
  BOARD_RED,
  UNROLL_RATIO,
  LG_PINK,
  PRE_LG,
  PRE_SPONSOR,
  UCL_DEEP,
  UCL_GLOW,
  type BoardSpec,
  type SubEvent,
} from './boardModel';
import { latinPlayer } from './boardNames';

const LALIGA_WORDMARK = 'LALIGA';

const UCL_MARK = 'CHAMPIONS LEAGUE';

const PANEL_BAR = 0.14;

const TEX_SCALE = 2;

const MAX_TEX_W = 4096;

const FALLBACK_STACK =
  '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

export function boardFontStack(): string {
  if (typeof document === 'undefined') return FALLBACK_STACK;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-bebas-neue')
    .trim();
  return v ? `${v}, ${FALLBACK_STACK}` : FALLBACK_STACK;
}

export interface BoardPaint {
  periodCssW: number;
}

function setSpacing(ctx: CanvasRenderingContext2D, value: string) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value;
  } catch {
    /* 지원하지 않는 브라우저 — 자간만 좁게 나온다 */
  }
}

const font = (px: number) => `400 ${Math.round(px)}px ${boardFontStack()}`;

const BOLD_STROKE = 0.055;

const LG_FONT_STACK = '"Arial Black", "Arial Bold", Arial, "Helvetica Neue", Helvetica, sans-serif';
const lgFont = (px: number) => `900 ${Math.round(px)}px ${LG_FONT_STACK}`;

const RIYADH_FALLBACK = 'Tahoma, Verdana, "Segoe UI", Helvetica, Arial, sans-serif';

export function riyadhFontStack(): string {
  if (typeof document === 'undefined') return RIYADH_FALLBACK;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-el-messiri')
    .trim();
  return v ? `${v}, ${RIYADH_FALLBACK}` : RIYADH_FALLBACK;
}

const riyadhFont = (px: number) => `600 ${Math.round(px)}px ${riyadhFontStack()}`;
const RIYADH_SIZE_RATIO = 0.86;

export function paintBoard(
  canvas: HTMLCanvasElement,
  spec: BoardSpec,
  unrollCssW: number,
  cssH: number
): BoardPaint | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const texH = Math.max(16, Math.round(cssH * TEX_SCALE));
  if (spec.mode === 'goal') return paintGoal(canvas, ctx, spec, texH);
  if (spec.mode === 'message' && spec.message) {
    return paintMessage(canvas, ctx, spec.message, texH);
  }
  if (spec.mode === 'sub' && spec.sub) {
    return paintSub(canvas, ctx, spec.sub, spec.subPhase ?? 1, unrollCssW, texH);
  }
  if (spec.mode === 'pre') return paintPre(canvas, ctx, spec, texH);
  return paintIdle(canvas, ctx, spec, unrollCssW, texH);
}

function paintSub(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  sub: SubEvent,
  phase: number,
  unrollCssW: number,
  texH: number
): BoardPaint {
  const texW = Math.min(MAX_TEX_W, Math.max(64, Math.round(unrollCssW * TEX_SCALE)));

  canvas.width = texW;
  canvas.height = texH;
  setSpacing(ctx, '0.2em');
  ctx.clearRect(0, 0, texW, texH);

  const into = latinPlayer(sub.playerIn).toUpperCase();
  const out = latinPlayer(sub.playerOut).toUpperCase();

  const usableW = texW / UNROLL_RATIO;

  const narrow = usableW / texH < 13;

  const fTag = texH * (narrow ? 0.36 : 0.56);
  const slant = texH * (narrow ? 0.6 : 0.75);

  ctx.font = font(fTag);
  const tagTextW = Math.max(ctx.measureText('IN').width, ctx.measureText('OUT').width);
  const tagPad = texH * (narrow ? 0.2 : 2.1);
  const tagW = tagTextW * 2 + slant + tagPad;

  const arrowIn = narrow ? '>>' : '>>>';
  const arrowOut = narrow ? '<<' : '<<<';

  const ARROW_FILL = 0.94;
  let fArrow = texH * 0.9;
  ctx.font = font(fArrow);
  const probe = ctx.measureText('>');
  const glyphH = (probe.actualBoundingBoxAscent ?? 0) + (probe.actualBoundingBoxDescent ?? 0);
  if (glyphH > 0) fArrow = (fArrow * texH * ARROW_FILL) / glyphH;

  setSpacing(ctx, '0em');
  const nameMin = usableW * (narrow ? 0.28 : 0.2);
  const arrowRoom = Math.max(texH * 0.7, (usableW - tagW) / 2 - nameMin);

  ctx.font = font(fArrow);
  let arrowTextW = ctx.measureText(arrowIn).width;
  if (arrowTextW > arrowRoom) {
    fArrow *= arrowRoom / arrowTextW;
    ctx.font = font(fArrow);
    arrowTextW = ctx.measureText(arrowIn).width;
  }
  const arrowW = arrowTextW + texH * 0.3;
  const nameTrack = narrow ? '0.06em' : '0.2em';
  setSpacing(ctx, nameTrack);

  let fName = texH * 0.9;
  ctx.font = font(fName);
  let widest = Math.max(ctx.measureText(into).width, ctx.measureText(out).width);

  const nameRoom = (usableW - tagW - arrowW * 2) / 2 - texH * 0.2;
  if (widest > nameRoom && widest > 0) {
    fName *= nameRoom / widest;
    ctx.font = font(fName);
    widest = Math.max(ctx.measureText(into).width, ctx.measureText(out).width);
  }

  const nameW = Math.max(0, widest) + texH * 0.2;
  const blockW = nameW * 2 + arrowW * 2 + tagW;
  const x0 = Math.max(0, (texW - blockW) / 2);

  const xNameIn = x0;
  const xArrowL = x0 + nameW;
  const xTag = xArrowL + arrowW;
  const xArrowR = xTag + tagW;
  const xNameOut = xArrowR + arrowW;
  const mid = xTag + tagW / 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, texW, texH);

  const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, phase)), 3);
  const shift = (1 - eased) * (blockW / 2 + x0);

  ctx.globalAlpha = eased;

  ctx.save();
  ctx.translate(-shift, 0);
  setSpacing(ctx, nameTrack);
  label(ctx, xNameIn, nameW, texH, into, BOARD_BLUE, fName);
  setSpacing(ctx, '0em');
  label(ctx, xArrowL, arrowW, texH, arrowIn, BOARD_GREEN, fArrow);
  setSpacing(ctx, '0.2em');

  ctx.beginPath();
  ctx.moveTo(xTag, 0);
  ctx.lineTo(mid + slant / 2, 0);
  ctx.lineTo(mid - slant / 2, texH);
  ctx.lineTo(xTag, texH);
  ctx.closePath();
  ctx.fillStyle = BOARD_GREEN;
  ctx.fill();

  label(ctx, xTag, tagW * 0.44, texH, 'IN', '#ffffff', fTag);
  ctx.restore();

  ctx.save();
  ctx.translate(shift, 0);

  ctx.beginPath();
  ctx.moveTo(mid + slant / 2, 0);
  ctx.lineTo(xTag + tagW, 0);
  ctx.lineTo(xTag + tagW, texH);
  ctx.lineTo(mid - slant / 2, texH);
  ctx.closePath();
  ctx.fillStyle = BOARD_RED;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(mid + slant / 2, 0);
  ctx.lineTo(mid - slant / 2, texH);
  ctx.lineWidth = Math.max(2, texH * 0.075);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  setSpacing(ctx, '0.2em');
  label(ctx, mid + slant * 0.15, tagW * 0.5, texH, 'OUT', '#ffffff', fTag);
  setSpacing(ctx, '0em');
  label(ctx, xArrowR, arrowW, texH, arrowOut, BOARD_RED, fArrow);
  setSpacing(ctx, nameTrack);
  label(ctx, xNameOut, nameW, texH, out, BOARD_BLUE, fName);
  ctx.restore();

  ctx.globalAlpha = 1;

  return { periodCssW: texW / TEX_SCALE };
}

function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  h: number,
  bg: string | CanvasGradient,
  text: string,
  color: string,
  fontPx: number,
  align: 'center' | 'left' | 'right' = 'center'
) {
  ctx.fillStyle = bg;
  ctx.fillRect(x, 0, w, h);
  label(ctx, x, w, h, text, color, fontPx, align);
}

function label(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  h: number,
  text: string,
  color: string,
  fontPx: number,
  align: 'center' | 'left' | 'right' = 'center',
  bold = false,
  fontCss?: string,
  yRatio = 0.52
) {
  if (!text) return;

  ctx.fillStyle = color;
  ctx.font = fontCss ?? font(fontPx);
  ctx.textBaseline = 'middle';

  const pad = Math.min(fontPx * 0.5, w * 0.12);
  const maxW = Math.max(1, w - pad);
  const y = h * yRatio;

  if (bold) {
    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineWidth = fontPx * BOLD_STROKE;
  }

  if (align === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y, maxW);
    if (bold) ctx.strokeText(text, x + w / 2, y, maxW);
  } else if (align === 'right') {
    ctx.textAlign = 'right';
    ctx.fillText(text, x + w - pad, y, maxW);
    if (bold) ctx.strokeText(text, x + w - pad, y, maxW);
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text, x + pad, y, maxW);
    if (bold) ctx.strokeText(text, x + pad, y, maxW);
  }
}

interface Cell {
  w: number;
  bg: string;
  text: string;
  color: string;
  font: number;
  align?: 'center' | 'left' | 'right';
  laliga?: boolean;
  ucl?: boolean;
  segments?: Segment[];
  bar?: 'left' | 'right';
}

interface Segment {
  text: string;
  fontCss?: string;
  track?: number;
}

function venueSegments(text: string, fontPx: number): Segment[] | undefined {
  const words = text.trim().split(' ').filter(Boolean);
  if (words.length < 2) return undefined;
  return [
    {
      text: `${words.slice(0, -1).join(' ')} `,
      fontCss: riyadhFont(fontPx * RIYADH_SIZE_RATIO),
      track: 0.02,
    },
    { text: words[words.length - 1] },
  ];
}

function segmentsWidth(
  ctx: CanvasRenderingContext2D,
  segments: Segment[],
  fontPx: number,
  track: number
): number {
  return segments.reduce((sum, seg) => {
    ctx.font = seg.fontCss ?? font(fontPx);
    setSpacing(ctx, `${seg.track ?? track}em`);
    return sum + ctx.measureText(seg.text).width;
  }, 0);
}

function drawSegments(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  h: number,
  segments: Segment[],
  color: string,
  fontPx: number,
  track: number
) {
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const apply = (seg: Segment) => {
    ctx.font = seg.fontCss ?? font(fontPx);
    setSpacing(ctx, `${seg.track ?? track}em`);
  };

  const widths = segments.map((seg) => {
    apply(seg);
    return ctx.measureText(seg.text).width;
  });

  let sx = x + (w - widths.reduce((a, b) => a + b, 0)) / 2;
  ctx.fillStyle = color;
  segments.forEach((seg, i) => {
    apply(seg);
    ctx.fillText(seg.text, sx, h * 0.52);
    sx += widths[i];
  });
}

function uclPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  h: number,
  text: string,
  fontPx: number
) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 0, w, h);
  ctx.clip();

  const night = ctx.createLinearGradient(x, 0, x, h);
  night.addColorStop(0, UCL_DEEP);
  night.addColorStop(1, '#071a4d');
  ctx.fillStyle = night;
  ctx.fillRect(x, 0, w, h);

  const glow = ctx.createRadialGradient(x + w / 2, h * 0.95, 0, x + w / 2, h * 0.95, w * 0.42);
  glow.addColorStop(0, UCL_GLOW);
  glow.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
  glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x, 0, w, h);

  const bar = Math.max(3, h * PANEL_BAR);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, 0, bar, h);
  ctx.fillRect(x + w - bar, 0, bar, h);

  ctx.restore();

  label(ctx, x, w, h, text, '#ffffff', fontPx);
}

function laligaPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  w: number,
  h: number,
  fontPx: number
) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, 0, w, h);

  const dot = h * 0.52;
  const gap = fontPx * 0.34;

  ctx.font = font(fontPx);
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';

  const textW = ctx.measureText(LALIGA_WORDMARK).width;
  const startX = x + (w - (textW + gap + dot)) / 2;

  ctx.fillStyle = BOARD_RED;
  ctx.fillText(LALIGA_WORDMARK, startX, h * 0.52, textW);

  const cx = startX + textW + gap + dot / 2;
  ctx.beginPath();
  ctx.arc(cx, h * 0.5, dot / 2, 0, Math.PI * 2);
  ctx.fill();

  setSpacing(ctx, '0');
  const eaFont = dot * 0.54;
  ctx.fillStyle = '#ffffff';
  ctx.font = font(eaFont);
  ctx.textAlign = 'center';
  ctx.fillText('EA', cx, h * 0.52, dot * 0.82);
  setSpacing(ctx, '0.06em');
}

/**
 * 평상시 보드 — 정지된 대칭 배치. 가운데가 시계다.
 *   [경기장][구단][리그][득점 홈코드 시계 원정코드 득점][리그][구단][경기장]
 */
function paintIdle(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BoardSpec,
  unrollCssW: number,
  texH: number
): BoardPaint {
  const texW = Math.min(MAX_TEX_W, Math.max(64, Math.round(unrollCssW * TEX_SCALE)));
  canvas.width = texW;
  canvas.height = texH;

  const fMain = texH * 0.42;
  const fLeague = texH * 0.35;
  const fNum = texH * 0.62;
  const fClock = texH * 0.52;
  const pad = texH * 0.3;

  setSpacing(ctx, '0.06em');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, texW, texH);

  const wOf = (text: string, px: number) => {
    ctx.font = font(px);
    return ctx.measureText(text).width;
  };

  const home = String(spec.homeScore);
  const away = String(spec.awayScore);
  const club = spec.atletiName.toUpperCase();

  const white = '#ffffff';
  const red = { bg: white, color: BOARD_RED };

  const isLaliga = spec.competition.startsWith(LALIGA_WORDMARK);
  const isUcl = spec.competition.includes(UCL_MARK);

  const league = (): Cell =>
    isLaliga
      ? {
          w: wOf(LALIGA_WORDMARK, fLeague) + fLeague * 0.34 + texH * 0.52 + pad * 4.8,
          bg: white,
          text: LALIGA_WORDMARK,
          color: BOARD_RED,
          font: fLeague,
          laliga: true,
        }
      : isUcl
        ? {
            w: wOf(spec.competition, fLeague) + pad * 2.2 + texH * PANEL_BAR * 2,
            bg: UCL_DEEP,
            text: spec.competition,
            color: white,
            font: fLeague,
            ucl: true,
          }
        : { w: wOf(spec.competition, fLeague) + pad * 1.3, ...red, text: spec.competition, font: fLeague };

  const venue = (bar: 'left' | 'right'): Cell => {
    const segments = venueSegments(spec.venue, fLeague);
    return {
      w:
        (segments ? segmentsWidth(ctx, segments, fLeague, 0.06) : wOf(spec.venue, fLeague)) +
        pad * 1.4 +
        texH * PANEL_BAR,
      bg: BOARD_BLUE,
      text: segments ? '' : spec.venue,
      color: white,
      font: fLeague,
      segments,
      bar,
    };
  };

  const cells: Cell[] = [
    venue('left'),
    league(),

    { w: Math.max(fNum * 1.25, wOf(home, fNum) + pad), bg: BOARD_BLUE, text: home, color: white, font: fNum },
    {
      w: wOf(spec.homeCode, fMain) + pad,
      bg: white,
      text: spec.homeCode,
      color: spec.homeIsAtleti ? BOARD_RED : BOARD_BLUE,
      font: fMain,
    },
    { w: wOf(spec.clock, fClock) + pad * 1.2, bg: BOARD_BLUE, text: spec.clock, color: white, font: fClock },
    {
      w: wOf(spec.awayCode, fMain) + pad,
      bg: white,
      text: spec.awayCode,
      color: spec.awayIsAtleti ? BOARD_RED : BOARD_BLUE,
      font: fMain,
    },
    { w: Math.max(fNum * 1.25, wOf(away, fNum) + pad), bg: BOARD_BLUE, text: away, color: white, font: fNum },

    league(),
    venue('right'),
  ];

  const inner = cells.reduce((sum, c) => sum + c.w, 0);
  const remainder = texW - inner;

  if (remainder > 0) {
    const half = remainder / 2;
    cells.unshift({ w: half, bg: BOARD_RED, text: club, color: white, font: fMain, align: 'right' });
    cells.push({ w: half, bg: BOARD_RED, text: club, color: white, font: fMain, align: 'left' });
  }

  let x = remainder > 0 ? 0 : remainder / 2;
  for (const c of cells) {
    if (c.laliga) {
      laligaPanel(ctx, x, c.w, texH, c.font);
    } else if (c.ucl) {
      uclPanel(ctx, x, c.w, texH, c.text, c.font);
    } else if (c.segments) {
      ctx.fillStyle = c.bg;
      ctx.fillRect(x, 0, c.w, texH);

      if (c.bar) {
        const bar = Math.max(3, texH * PANEL_BAR);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(c.bar === 'left' ? x : x + c.w - bar, 0, bar, texH);
      }

      drawSegments(ctx, x, c.w, texH, c.segments, c.color, c.font, 0.06);
      setSpacing(ctx, '0.06em');
    } else {
      panel(ctx, x, c.w, texH, c.bg, c.text, c.color, c.font, c.align ?? 'center');
    }
    x += c.w;
  }

  return { periodCssW: texW / TEX_SCALE };
}

interface PreCell extends Cell {
  track: number;
  bold?: boolean;
  fontCss?: string;
  lines?: string[];
}

interface PreDesign {
  text?: string;
  lines?: string[];
  bg: string;
  color: string;
  size: number;
  track: number;
  pad: number;
  bold?: boolean;
  leadBold?: boolean;
}

/**
 * 킥오프 전 보드 — 스코어도 시계도 없이 판이 왼쪽으로 흐른다. 텍스처는 한 벌만 굽고 반복은 셰이더가 한다.
 *
 * 한 벌:
 *   [ATLÉTICO DE MADRID · 빨강][Life's Good · 흰][RIYADH AIR METROPOLITANO · 파랑][VISIT RWANDA · 흰]
 */
function paintPre(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BoardSpec,
  texH: number
): BoardPaint {
  const white = '#ffffff';

  const DESIGN: Record<'club' | 'venue' | 'sponsor', PreDesign> = {
    club: { text: spec.atletiName.toUpperCase(), bg: BOARD_RED, color: white, size: 0.38, track: 0.05, pad: 1.0 },
    venue: { text: spec.venue, bg: BOARD_BLUE, color: white, size: 0.34, track: 0.09, pad: 1.0, leadBold: true },
    sponsor: {
      lines: PRE_SPONSOR.split(' '),
      bg: white,
      color: ATLETI_NAVY,
      size: 0.33,
      track: 0.1,
      pad: 4.8,
    },
  };

  const lg = (): PreCell => {
    const fontPx = texH * 0.36;
    const track = 0.01;
    setSpacing(ctx, `${track}em`);
    ctx.font = lgFont(fontPx);

    return {
      w: ctx.measureText(PRE_LG).width + fontPx * 2,
      bg: white,
      text: PRE_LG,
      color: LG_PINK,
      font: fontPx,
      track,
      fontCss: lgFont(fontPx),
    };
  };

  const textCell = (d: PreDesign): PreCell => {
    const fontPx = texH * d.size;
    setSpacing(ctx, `${d.track}em`);
    ctx.font = font(fontPx);

    const segments = d.leadBold && d.text ? venueSegments(d.text, fontPx) : undefined;

    const widest = segments
      ? segmentsWidth(ctx, segments, fontPx, d.track)
      : d.lines
        ? Math.max(...d.lines.map((line) => ctx.measureText(line).width))
        : ctx.measureText(d.text ?? '').width;

    return {
      w: widest + fontPx * d.pad * 2,
      bg: d.bg,
      text: d.lines ? '' : d.text ?? '',
      lines: d.lines,
      segments,
      color: d.color,
      font: fontPx,
      track: d.track,
      bold: d.bold ?? false,
    };
  };

  const run: PreCell[] = [
    textCell(DESIGN.club),
    lg(),
    textCell(DESIGN.venue),
    textCell(DESIGN.sponsor),
  ];

  const runW = run.reduce((sum, c) => sum + c.w, 0);
  const texW = Math.min(MAX_TEX_W, Math.max(64, Math.round(runW)));
  run[run.length - 1].w += texW - runW;

  canvas.width = texW;
  canvas.height = texH;

  ctx.fillStyle = white;
  ctx.fillRect(0, 0, texW, texH);

  let x = 0;
  for (const c of run) {
    ctx.fillStyle = c.bg;
    ctx.fillRect(x, 0, c.w, texH);
    setSpacing(ctx, `${c.track}em`);
    if (c.segments) {
      drawSegments(ctx, x, c.w, texH, c.segments, c.color, c.font, c.track);
    } else if (c.lines) {
      const step = (c.font * 0.86) / texH;
      c.lines.forEach((line, i) => {
        const offset = (i - (c.lines!.length - 1) / 2) * step;
        label(ctx, x, c.w, texH, line, c.color, c.font, 'center', c.bold, undefined, 0.52 + offset);
      });
    } else {
      label(ctx, x, c.w, texH, c.text, c.color, c.font, 'center', c.bold, c.fontCss);
    }
    x += c.w;
  }

  return { periodCssW: texW / TEX_SCALE };
}

function paintMessage(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  message: string,
  texH: number
): BoardPaint {
  const fontPx = texH * 0.62;
  const pad = texH * 0.9;

  setSpacing(ctx, '0.08em');
  ctx.font = font(fontPx);
  const textW = ctx.measureText(message).width;
  const texW = Math.min(MAX_TEX_W, Math.round(textW + pad * 2));

  canvas.width = texW;
  canvas.height = texH;
  setSpacing(ctx, '0.08em');
  ctx.clearRect(0, 0, texW, texH);

  panel(ctx, 0, texW, texH, '#ffffff', message, BOARD_RED, fontPx);

  return { periodCssW: texW / TEX_SCALE };
}

function paintGoal(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BoardSpec,
  texH: number
): BoardPaint {
  const fName = texH * 0.86;
  const fShout = texH * 0.5;
  const pad = texH * 0.7;

  setSpacing(ctx, '0.2em');

  const shout = 'GOOOOOOOL!!!!';
  const name = spec.scorer ? latinPlayer(spec.scorer).toUpperCase() : '';

  ctx.font = font(fShout);
  const wShout = ctx.measureText(shout).width;
  ctx.font = font(fName);
  const wName = name ? ctx.measureText(name).width : 0;

  const panelW = Math.max(wShout, wName) + pad * 2;
  const count = name ? 2 : 1;
  const texW = Math.min(MAX_TEX_W, Math.round(panelW * count));

  canvas.width = texW;
  canvas.height = texH;
  setSpacing(ctx, '0.2em');
  ctx.clearRect(0, 0, texW, texH);

  const cell = texW / count;
  let x = 0;

  if (name) {
    panel(ctx, x, cell, texH, '#ffffff', name, BOARD_BLUE, fName);
    x += cell;
  }

  const ramp = Math.min(pad, cell * 0.4) / cell;
  const grad = ctx.createLinearGradient(x, 0, x + cell, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(ramp, BOARD_RED);
  grad.addColorStop(1 - ramp, BOARD_RED);
  grad.addColorStop(1, '#ffffff');
  panel(ctx, x, cell, texH, grad, shout, '#ffffff', fShout);

  return { periodCssW: texW / TEX_SCALE };
}
