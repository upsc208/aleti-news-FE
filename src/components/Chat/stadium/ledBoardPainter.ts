/**
 * 보드 내용을 오프스크린 canvas 2D에 그린다 — WebGL 보드(LedRing)의 텍스처가 된다.
 *
 * DOM 글자를 WebGL에 직접 넣을 방법이 없으므로 한 번 래스터로 굽는다.
 * 다행히 보드 내용은 점수·시계·득점자가 바뀔 때만 달라져서, 굽는 일은 드물게 일어난다.
 * 흐르는 것은 셰이더의 UV 오프셋이 하므로 매 프레임 다시 그리지 않는다.
 *
 * 좌표는 전부 '텍스처 픽셀'이다. 화면 CSS 픽셀과의 환산은 TEX_SCALE이 맡는다.
 */

import {
  ATLETI_NAVY,
  BOARD_BLUE,
  BOARD_RED,
  LG_PINK,
  PRE_SPONSOR,
  type BoardSpec,
} from './boardModel';
import { latinPlayer } from './boardNames';

/** 텍스처를 화면보다 이만큼 크게 굽는다 — 곡면 가운데가 눌리면서 확대되는 구간이 있다 */
const TEX_SCALE = 2;

/** 텍스처 가로 상한. 넘으면 화질을 포기하고 폭을 맞춘다 */
const MAX_TEX_W = 4096;

/** Bebas Neue를 못 찾았을 때 (SSR, 변수 미설정) 쓸 글꼴 */
const FALLBACK_STACK =
  '"Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans KR", sans-serif';

/**
 * 보드 서체 — CSS 보드와 같은 Bebas Neue를 쓴다.
 *
 * next/font는 실제 패밀리 이름을 빌드마다 새로 만들어(`__Bebas_Neue_a1b2c3`)
 * CSS 변수에 넣는다. 캔버스는 CSS 변수를 모르므로 여기서 계산된 값을 읽어 온다.
 * globals.css의 `--led-font`와 같은 값이라 두 보드의 글자가 어긋나지 않는다.
 */
export function boardFontStack(): string {
  if (typeof document === 'undefined') return FALLBACK_STACK;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-bebas-neue')
    .trim();
  return v ? `${v}, ${FALLBACK_STACK}` : FALLBACK_STACK;
}

export interface BoardPaint {
  /** 이 텍스처 한 벌이 펼쳐진 띠에서 차지하는 폭(CSS px). UV 배수를 여기서 구한다 */
  periodCssW: number;
}

/** 캔버스 2D의 letterSpacing은 비교적 최근 기능이다 — 없으면 조용히 넘어간다 */
function setSpacing(ctx: CanvasRenderingContext2D, value: string) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = value;
  } catch {
    /* 지원하지 않는 브라우저 — 자간만 좁게 나온다 */
  }
}

// Bebas Neue는 400 한 종뿐이다 — 900을 주면 브라우저가 가짜로 굵혀 획이 뭉갠다
const font = (px: number) => `400 ${Math.round(px)}px ${boardFontStack()}`;

/**
 * 굵게 찍을 때 글자 외곽에 덧대는 획의 두께 (글자 크기 대비).
 *
 * Bebas Neue는 400 한 종뿐이라 굵은 자체가 없다. 0.1까지 올려봤더니 A·D·R의 속이
 * 메워져 글자가 뭉갰다 — 이 값이 "굵어 보이되 안 뭉개는" 자리다.
 */
const BOLD_STROKE = 0.055;


/**
 * LG 칸만 쓰는 서체.
 *
 * 로고는 상표라 못 쓰지만, 글자를 실물 워드마크 비율에 맞출 수는 있다. LG 워드마크는
 * **두껍고 폭이 넓으며 두 글자가 거의 붙어 있다** — 보드 서체(좁고 가느다란 Bebas Neue)와
 * 정반대다. 그래서 이 칸만 굵은 기하학적 산세리프로 뽑는다. 실물 보드도 후원 칸은
 * 그 브랜드의 서체로 나오니 여기서 서체가 달라지는 것이 오히려 맞다.
 */
const LG_FONT_STACK = '"Arial Black", "Arial Bold", Arial, "Helvetica Neue", Helvetica, sans-serif';
const lgFont = (px: number) => `900 ${Math.round(px)}px ${LG_FONT_STACK}`;

/**
 * 항공사 이름("RIYADH AIR")만 쓰는 서체.
 *
 * 실물 보드에서도 이 자리는 항공사 워드마크라 경기장 이름과 서체가 다르다. 보드 서체는
 * 좁고 높은 Bebas Neue인데, 그 옆에 폭이 넓은 일반 산세리프를 두면 두 이름이 확실히
 * 갈린다 — 굵기만 다르게 줬을 때보다 훨씬 분명하다.
 *
 * 서체가 다르니 획을 덧대 굵히지 않아도 된다. 진짜 굵은 자체(600)를 쓴다.
 * 대문자 높이가 Bebas보다 낮아서 크기는 0.82배로 맞춰야 두 이름의 글자 키가 같아진다.
 */
const RIYADH_FONT_STACK = 'Tahoma, Verdana, "Segoe UI", Helvetica, Arial, sans-serif';
const riyadhFont = (px: number) => `700 ${Math.round(px)}px ${RIYADH_FONT_STACK}`;
/** Bebas 대비 이 서체의 대문자 높이 보정 */
const RIYADH_SIZE_RATIO = 0.7;

/**
 * 보드를 굽는다.
 *
 * @param canvas     오프스크린 캔버스 (호출부가 들고 있는다)
 * @param spec       그릴 내용
 * @param unrollCssW 펼친 띠의 폭(CSS px) — 곡면이라 화면 폭보다 길다
 * @param cssH       보드 높이(CSS px)
 */
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
  if (spec.mode === 'pre') return paintPre(canvas, ctx, spec, texH);
  return paintIdle(canvas, ctx, spec, unrollCssW, texH);
}

/** 색 판 하나 — 배경을 칠하고 가운데에 글자를 얹는다 */
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

/**
 * 이미 칠해진 판 위에 글자만 얹는다.
 *
 * [bold]는 글자 외곽에 같은 색 획을 덧대 굵기를 만든다. Bebas Neue는 400 한 종뿐이라
 * 굵은 자체가 없고, 900을 주면 브라우저가 가짜로 굵혀 획이 뭉갠다. 골 연출의 득점자
 * 이름도 같은 방법으로 굵힌다(globals.css의 -webkit-text-stroke).
 */
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

  const pad = fontPx * 0.5;
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
}

/**
 * 평상시 보드 — 정지된 대칭 배치. 가운데가 시계다.
 *
 * 배치:
 *   [경기장][구단][리그][득점 홈코드 시계 원정코드 득점][리그][구단][경기장]
 *
 * 한 벌이 펼친 띠 전체를 덮으므로 UV 배수는 1이고 스크롤도 없다.
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

  // Bebas Neue는 좁고 높은 서체라 같은 판을 채우는 데 더 큰 크기가 필요하다
  const fMain = texH * 0.42;
  const fLeague = texH * 0.35;
  const fNum = texH * 0.62;
  const fClock = texH * 0.52;
  const pad = texH * 0.3;

  setSpacing(ctx, '0.06em');
  // 판 사이에 반픽셀 틈이 생겨도 경기장 사진이 비치지 않도록 바탕을 흰색으로 깐다
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

  const cells: Cell[] = [
    { w: wOf(club, fMain) + pad * 1.5, bg: BOARD_RED, text: club, color: white, font: fMain },
    // 요청받은 리그 칸 — 예전에는 여기가 빈 흰 칸이었다
    { w: wOf(spec.competition, fLeague) + pad * 1.3, ...red, text: spec.competition, font: fLeague },

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

    { w: wOf(spec.competition, fLeague) + pad * 1.3, ...red, text: spec.competition, font: fLeague },
    { w: wOf(club, fMain) + pad * 1.5, bg: BOARD_RED, text: club, color: white, font: fMain },
  ];

  const inner = cells.reduce((sum, c) => sum + c.w, 0);
  const remainder = texW - inner;

  // 남는 폭이 있으면 양 끝을 경기장 이름으로 채운다. 글자는 안쪽에 붙여
  // 바깥으로 이어지는 것처럼 자른다.
  if (remainder > 0) {
    const half = remainder / 2;
    cells.unshift({ w: half, ...red, text: spec.venue, font: fLeague, align: 'right' });
    cells.push({ w: half, ...red, text: spec.venue, font: fLeague, align: 'left' });
  }

  // 폭이 모자라면 음수에서 시작해 좌우로 똑같이 넘친다 —
  // 시계가 텍스처 정중앙에 남아야 화면 정중앙에 선다.
  let x = remainder > 0 ? 0 : remainder / 2;
  for (const c of cells) {
    panel(ctx, x, c.w, texH, c.bg, c.text, c.color, c.font, c.align ?? 'center');
    x += c.w;
  }

  return { periodCssW: texW / TEX_SCALE };
}

/** 킥오프 전 보드의 판 한 장 — 크기·자간·여백이 판마다 다르다 */
interface PreCell extends Cell {
  /** em 단위 자간 */
  track: number;
  /** 글자 외곽에 획을 덧대 굵힌다 */
  bold?: boolean;
  /** 보드 서체 대신 쓸 CSS font 문자열 (LG 칸) */
  fontCss?: string;
  /** 한 칸에 여러 줄로 쌓아 올릴 글자 (VISIT / RWANDA) */
  lines?: string[];
  /** 한 줄 안에서 서체·굵기가 다른 토막들 (RIYADH AIR + METROPOLITANO) */
  segments?: { text: string; fontCss?: string; track?: number }[];
}

/** 킥오프 전 보드의 판 하나를 정하는 값. size·pad는 보드 높이 대비 비율, track은 em 자간 */
interface PreDesign {
  text?: string;
  /** 두 줄 이상으로 쌓을 때 */
  lines?: string[];
  bg: string;
  color: string;
  size: number;
  track: number;
  pad: number;
  bold?: boolean;
  /** 마지막 낱말만 기본 굵기로 두고 앞은 굵게 — "RIYADH AIR" + "METROPOLITANO" */
  leadBold?: boolean;
}

/**
 * 킥오프 전 보드 — 스코어도 시계도 없다. 판이 왼쪽으로 흐른다.
 *
 * 한 벌:
 *   [ATLÉTICO DE MADRID · 빨강][LG · 흰 정사각][RIYADH AIR METROPOLITANO · 파랑][VISIT RWANDA · 흰]
 *
 * 이 차례라 판 색이 빨강·흰·파랑·흰으로 번갈아 온다 — 같은 색이 맞닿는 자리가 없어서
 * 판 사이에 따로 이음선을 끼우지 않아도 칸이 나뉜다.
 *
 * **텍스처는 딱 한 벌만 굽는다.** 띠를 채우는 일은 셰이더가 한다(텍스처 WRAP이 REPEAT다).
 * 화면 폭에 맞춰 여러 벌을 구워 넣으면 텍스처 양 끝에서 판이 중간에 잘리고, 흐를 때
 * 그 이음매가 한 바퀴마다 툭 튄다. 한 벌만 구우면 마지막 픽셀과 첫 픽셀이 그대로 이어진다.
 * 그래서 좁은 화면이라고 글자를 줄일 필요도 없다 — 어차피 지나가면서 다 읽힌다.
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
    // 항공사 이름만 굵고 경기장 이름은 기본 굵기다 — 실물 보드의 그 표기다
    venue: { text: spec.venue, bg: BOARD_BLUE, color: white, size: 0.34, track: 0.09, pad: 1.0, leadBold: true },
    /*
      후원 문구는 실물 유니폼·보드처럼 VISIT / RWANDA 두 줄로 쌓고 남색으로 찍는다.
      두 줄이라 한 줄일 때보다 글자를 키울 수 있어서, 칸은 좁아지는데 글자는 오히려 크다.
    */
    sponsor: {
      lines: PRE_SPONSOR.split(' '),
      bg: white,
      color: ATLETI_NAVY,
      size: 0.33,
      track: 0.1,
      // 워드마크처럼 양옆을 비운다 — 이 칸은 글자보다 여백이 훨씬 넓다
      pad: 4.8,
    },
  };

  /**
   * 폭이 보드 높이와 같은 정사각형 후원 칸.
   *
   * 자간을 음수로 좁히고 획을 덧대 굵힌다 — 실물 워드마크가 두 글자를 거의 붙여 놓은
   * 굵은 글자다. 보드 서체로 그리면 좁고 가늘어서 LG로 안 읽힌다 (LG_FONT_STACK 참고).
   */
  const lg = (): PreCell => ({
    w: texH * 1.18,
    bg: white,
    text: 'LG',
    color: LG_PINK,
    font: texH * 0.46,
    track: -0.02,
    bold: true,
    fontCss: lgFont(texH * 0.46),
  });

  /**
   * 마지막 낱말만 기본 굵기로 남기고 앞을 굵게 — "RIYADH AIR" / "METROPOLITANO".
   * 낱말이 하나뿐인 경기장 이름이면 쪼개지 않는다.
   */
  const splitLead = (text: string, fontPx: number) => {
    const words = text.trim().split(/s+/);
    if (words.length < 2) return undefined;
    const last = words[words.length - 1];
    return [
      {
        text: `${words.slice(0, -1).join(' ')} `,
        fontCss: riyadhFont(fontPx * RIYADH_SIZE_RATIO),
        track: 0.02,
      },
      { text: last },
    ];
  };

  const textCell = (d: PreDesign): PreCell => {
    const fontPx = texH * d.size;
    setSpacing(ctx, `${d.track}em`);
    ctx.font = font(fontPx);

    const segments = d.leadBold && d.text ? splitLead(d.text, fontPx) : undefined;

    // 토막마다 서체가 다르면 폭도 각자의 서체로 재야 한다 —
    // 보드 서체로 한 번에 재면 실제로 그려지는 폭과 어긋나 글자가 판 밖으로 나간다.
    const widest = segments
      ? segments.reduce((sum, seg) => {
          ctx.font = seg.fontCss ?? font(fontPx);
          setSpacing(ctx, `${seg.track ?? d.track}em`);
          return sum + ctx.measureText(seg.text).width;
        }, 0)
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
  // 반올림하면서 남거나 모자란 폭은 마지막 칸이 흡수한다. 텍스처 끝과 다음 벌의 시작이
  // 반 픽셀이라도 어긋나면 흐를 때마다 그 자리에 흰 줄이 지나간다.
  run[run.length - 1].w += texW - runW;

  canvas.width = texW;
  canvas.height = texH;

  // 판 사이에 반픽셀 틈이 생겨도 경기장 사진이 비치지 않도록 바탕을 흰색으로 깐다
  ctx.fillStyle = white;
  ctx.fillRect(0, 0, texW, texH);

  let x = 0;
  for (const c of run) {
    ctx.fillStyle = c.bg;
    ctx.fillRect(x, 0, c.w, texH);
    setSpacing(ctx, `${c.track}em`);
    if (c.segments) {
      // 토막마다 서체가 다르므로 한 번에 그릴 수 없다. 폭을 먼저 다 재서 전체를
      // 가운데에 놓고, 왼쪽부터 토막을 이어 붙인다.
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';

      const apply = (seg: { fontCss?: string; track?: number }) => {
        ctx.font = seg.fontCss ?? font(c.font);
        setSpacing(ctx, `${seg.track ?? c.track}em`);
      };

      const widths = c.segments.map((seg) => {
        apply(seg);
        return ctx.measureText(seg.text).width;
      });

      let sx = x + (c.w - widths.reduce((a, b) => a + b, 0)) / 2;
      ctx.fillStyle = c.color;
      c.segments.forEach((seg, i) => {
        apply(seg);
        ctx.fillText(seg.text, sx, texH * 0.52);
        sx += widths[i];
      });
    } else if (c.lines) {
      // 줄 간격은 글자 크기의 0.86배 — 실물 워드마크처럼 두 줄을 바짝 붙여 쌓는다
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

/**
 * 골 연출 보드 — 득점자(흰 판/파란 글자)와 함성(빨간 판/흰 글자) 두 장.
 *
 * 한 벌이 두 판이고 그게 계속 반복된다(텍스처 WRAP이 REPEAT다).
 * 그래서 마지막 픽셀과 첫 픽셀의 색이 이어져야 한다 — 빨간 판 양끝이 흰색으로
 * 빠지고 득점자 판이 흰색이라 이음매가 보이지 않는다.
 */
function paintGoal(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BoardSpec,
  texH: number
): BoardPaint {
  const fMain = texH * 0.5;
  const pad = texH * 0.7;

  setSpacing(ctx, '0.2em');

  const shout = 'GOOOOOOOL!!!!';
  const name = spec.scorer ? latinPlayer(spec.scorer).toUpperCase() : '';

  ctx.font = font(fMain);
  const wShout = ctx.measureText(shout).width;
  const wName = name ? ctx.measureText(name).width : 0;

  // 두 판의 폭을 같게 — CSS 보드의 grid 1fr과 같은 결과다
  const panelW = Math.max(wShout, wName) + pad * 2;
  const count = name ? 2 : 1;
  const texW = Math.min(MAX_TEX_W, Math.round(panelW * count));

  canvas.width = texW;
  canvas.height = texH;
  setSpacing(ctx, '0.2em'); // 캔버스 크기를 바꾸면 컨텍스트 상태가 초기화된다
  ctx.clearRect(0, 0, texW, texH);

  const cell = texW / count;
  let x = 0;

  if (name) {
    panel(ctx, x, cell, texH, '#ffffff', name, BOARD_BLUE, fMain);
    x += cell;
  }

  // 빨간 판 — 양끝 pad 구간에서 흰색으로 빠진다. 글자가 시작되는 지점에서 이미 단색이다
  const ramp = Math.min(pad, cell * 0.4) / cell;
  const grad = ctx.createLinearGradient(x, 0, x + cell, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(ramp, BOARD_RED);
  grad.addColorStop(1 - ramp, BOARD_RED);
  grad.addColorStop(1, '#ffffff');
  panel(ctx, x, cell, texH, grad, shout, '#ffffff', fMain);

  return { periodCssW: texW / TEX_SCALE };
}
