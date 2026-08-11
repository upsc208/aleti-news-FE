/**
 * 보드 내용을 오프스크린 canvas 2D에 그린다 — WebGL 보드(LedRing)의 텍스처가 된다.
 *
 * DOM 글자를 WebGL에 직접 넣을 방법이 없으므로 한 번 래스터로 굽는다.
 * 다행히 보드 내용은 점수·시계·득점자가 바뀔 때만 달라져서, 굽는 일은 드물게 일어난다.
 * 흐르는 것은 셰이더의 UV 오프셋이 하므로 매 프레임 다시 그리지 않는다.
 *
 * 좌표는 전부 '텍스처 픽셀'이다. 화면 CSS 픽셀과의 환산은 TEX_SCALE이 맡는다.
 */

import { BOARD_BLUE, BOARD_RED, type BoardSpec } from './boardModel';
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
  return spec.mode === 'goal'
    ? paintGoal(canvas, ctx, spec, texH)
    : paintIdle(canvas, ctx, spec, unrollCssW, texH);
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

  if (!text) return;

  ctx.fillStyle = color;
  ctx.font = font(fontPx);
  ctx.textBaseline = 'middle';

  const pad = fontPx * 0.5;
  if (align === 'center') {
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, h * 0.52, Math.max(1, w - pad));
  } else if (align === 'right') {
    ctx.textAlign = 'right';
    ctx.fillText(text, x + w - pad, h * 0.52, Math.max(1, w - pad));
  } else {
    ctx.textAlign = 'left';
    ctx.fillText(text, x + pad, h * 0.52, Math.max(1, w - pad));
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
