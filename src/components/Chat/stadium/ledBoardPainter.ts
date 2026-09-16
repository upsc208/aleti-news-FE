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
  BOARD_GREEN,
  BOARD_RED,
  UNROLL_RATIO,
  LG_PINK,
  PRE_SPONSOR,
  UCL_DEEP,
  UCL_GLOW,
  type BoardSpec,
  type SubEvent,
} from './boardModel';
import { latinPlayer } from './boardNames';

/** 리그 칸이 라리가인지 가리는 말 — latinCompetition이 'LALIGA EA SPORTS'로 맞춰 준다 */
const LALIGA_WORDMARK = 'LALIGA';

/** 챔피언스리그인지 가리는 말 — latinCompetition이 'UEFA CHAMPIONS LEAGUE'로 맞춰 준다 */
const UCL_MARK = 'CHAMPIONS LEAGUE';

/**
 * 판을 끊어주는 흰 세로 바의 두께 (보드 높이 대비).
 *
 * 같은 색이나 비슷한 톤의 판이 맞닿으면 한 덩어리로 붙어 보인다. 라리가 칸 양옆과
 * 경기장 판의 바깥쪽(구단 판과 닿는 면)이 그 자리다.
 */
const PANEL_BAR = 0.14;

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
 * 항공사 이름("RIYADH AIR")만 쓰는 서체 — El Messiri.
 *
 * 실물 보드에서도 이 자리는 항공사 워드마크라 경기장 이름과 서체가 다르다. 아랍어 서체
 * 가족이라 라틴 글자에도 서예 느낌의 미세한 플레어가 남아 있어서, 사우디 항공사 이름에
 * 어울리면서도 읽기는 그대로다. 후보를 나란히 놓고 골랐다 — Cairo·Tajawal·Almarai는
 * 라틴이 그냥 산세리프라 차이가 안 나고, Lalezar는 반대로 장식이 과했다.
 *
 * 서체가 다르니 획을 덧대 굵히지 않아도 된다. 진짜 굵은 자체(600)를 쓴다.
 *
 * next/font가 실제 패밀리 이름을 빌드마다 새로 만들므로(boardFontStack과 같은 사정)
 * CSS 변수에서 계산된 값을 읽어 온다.
 */
const RIYADH_FALLBACK = 'Tahoma, Verdana, "Segoe UI", Helvetica, Arial, sans-serif';

export function riyadhFontStack(): string {
  if (typeof document === 'undefined') return RIYADH_FALLBACK;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-el-messiri')
    .trim();
  return v ? `${v}, ${RIYADH_FALLBACK}` : RIYADH_FALLBACK;
}

const riyadhFont = (px: number) => `600 ${Math.round(px)}px ${riyadhFontStack()}`;
/** Bebas 대비 이 서체의 대문자 높이 보정 */
const RIYADH_SIZE_RATIO = 0.86;

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
  if (spec.mode === 'message' && spec.message) {
    return paintMessage(canvas, ctx, spec.message, texH);
  }
  if (spec.mode === 'sub' && spec.sub) {
    return paintSub(canvas, ctx, spec.sub, spec.subPhase ?? 1, unrollCssW, texH);
  }
  if (spec.mode === 'pre') return paintPre(canvas, ctx, spec, texH);
  return paintIdle(canvas, ctx, spec, unrollCssW, texH);
}

/**
 * 교체 화면 — `⇄ 46'` 판과 `LLORENTE ▸ DOMÍNGUEZ` 판.
 *
 * **골보다 조용하다.** 골은 흰 판에 파란 이름 + 빨간 함성으로 터지는데, 교체는 사건이
 * 아니라 정보다. 파란 판에 흰 글씨로 담담하게 간다 — 실물 보드도 교체는 그렇게 띄운다.
 *
 * 이름은 성만 쓴다. 두 명이 한 줄에 들어가야 해서 전체 이름으로는 판이 화면을 넘는다.
 */
function paintSub(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  sub: SubEvent,
  phase: number,
  unrollCssW: number,
  texH: number
): BoardPaint {
  /*
    실물 교체판의 배치다.

        [ MENDOZA >>> ][ IN ╱ OUT ][ <<< BAENA ]
            흰·파랑      연두 빨강     흰·파랑

    **두 무리가 좌우에서 들어와 가운데서 맞물린다.** 왼쪽 무리는 들어오는 선수·화살표·
    초록 쐐기, 오른쪽 무리는 빨강 쐐기·화살표·나가는 선수다. 쐐기 두 장이 만나는 순간
    사선 `/`가 완성된다 — 교체가 성립하는 장면을 그대로 그린 것이다.

    **한 벌이 보드를 통째로 채운다.** 골 보드처럼 짧은 판을 반복해 흘리지 않는다 —
    3초만 서 있다 사라지는 화면이라 같은 이름이 두 번 지나가면 누가 들어오고
    누가 나가는지 읽기 전에 헷갈린다. paintIdle과 같은 방식으로 링 한 바퀴를 한 벌로 잡는다.
  */
  const texW = Math.min(MAX_TEX_W, Math.max(64, Math.round(unrollCssW * TEX_SCALE)));

  canvas.width = texW;
  canvas.height = texH;
  setSpacing(ctx, '0.2em'); // 캔버스 크기를 바꾸면 컨텍스트 상태가 초기화된다
  ctx.clearRect(0, 0, texW, texH);

  // latinPlayer는 이미 라틴 표기면 성만 떼어 준다 (boardNames.ts)
  const into = latinPlayer(sub.playerIn).toUpperCase();
  const out = latinPlayer(sub.playerOut).toUpperCase();

  /*
    **판이 좁으면 IN/OUT을 조인다.**

    폰은 보드 폭이 높이의 열 배 안팎인데 데스크톱은 스무 배쯤 된다. 같은 크기로 그리면
    폰에서 표와 화살표가 폭을 다 먹고 이름 자리가 남지 않아 이름이 잘린다.
    표가 조금 작은 편이 이름이 잘리는 것보다 낫다 — 누가 들어오고 나가는지가 먼저다.

    화면 크기(px)가 아니라 **판의 가로세로 비**로 판단한다. 그래야 기기 판정 없이
    같은 규칙으로 돌고, 창을 줄여도 그대로 따라온다.
  */
  /*
    **화면에 실제로 보이는 폭.** 텍스처는 링에 UNROLL_RATIO만큼 펼쳐 감기므로 양 끝이
    뒤로 돌아간다. 텍스처 전체 폭에 맞춰 놓으면 딱 그만큼 이름이 잘린다 —
    긴 성(SØRLOTH)에서 먼저 드러난다.
  */
  const usableW = texW / UNROLL_RATIO;

  const narrow = usableW / texH < 13;

  const fTag = texH * (narrow ? 0.36 : 0.56);
  // 대각선이 눕는 정도. 판 높이에 비례해야 어느 화면에서나 같은 기울기로 보인다
  const slant = texH * (narrow ? 0.6 : 0.75);

  ctx.font = font(fTag);
  const tagTextW = Math.max(ctx.measureText('IN').width, ctx.measureText('OUT').width);
  /*
    표 좌우의 여백. 좁은 판에서는 이 자리를 이름과 화살표에 넘긴다 —
    다섯 조각이 폭을 나눠 쓰는데 IN/OUT은 색(초록·빨강)과 화살표 방향으로도 읽히니
    여기가 제일 먼저 양보할 자리다. **글자 크기(fTag)는 그대로 둔다** — 자리만 줄인다.
  */
  const tagPad = texH * (narrow ? 0.2 : 2.1);
  const tagW = tagTextW * 2 + slant + tagPad;

  /*
    화살표는 판 위아래에 닿을락 말락 하게 세운다 — 이 보드에서 가장 큰 글자다.

    **글자 크기가 아니라 실제 획 높이로 맞춘다.** `>`는 대문자보다 한참 낮게 그려지는
    글자라 이름과 같은 배수를 주면 눈에 띄게 작아진다. 그려질 높이를 재서 역산한다.
  */
  /*
    **좁은 판에서는 화살표를 두 개만 쓴다.**

    화살표 칸은 글자 수에 비례해 폭을 먹는다. 폰에서 세 개를 유지하면 같은 칸에
    세 글자를 욱여넣느라 화살표 자체가 작아지고(실측 0.85), 이름에 넘길 폭도 안 남는다.
    두 개로 줄이면 화살표는 오히려 커지고(0.89) 이름 몫도 생긴다.

    넓은 판(PC)은 폭이 남아 세 개가 다 크게 들어가므로 그대로 둔다.
  */
  const arrowIn = narrow ? '>>' : '>>>';
  const arrowOut = narrow ? '<<' : '<<<';

  const ARROW_FILL = 0.94;
  let fArrow = texH * 0.9;
  ctx.font = font(fArrow);
  const probe = ctx.measureText('>');
  const glyphH = (probe.actualBoundingBoxAscent ?? 0) + (probe.actualBoundingBoxDescent ?? 0);
  if (glyphH > 0) fArrow = (fArrow * texH * ARROW_FILL) / glyphH;

  /*
    화살표는 자간을 붙인다. 이 보드의 다른 글자는 0.2em으로 벌려 쓰는데, 그 배수를
    이만큼 큰 글자에 그대로 주면 화살표 세 개가 판 폭을 다 먹고 이름이 읽을 수 없게 작아진다.

    그리고 **이름 자리를 먼저 떼어 둔다.** 남는 폭에 화살표를 맞추지, 그 반대가 아니다 —
    누가 들어오고 나가는지가 화살표보다 중요하다.
  */
  setSpacing(ctx, '0em');
  /*
    **이름이 받는 폭은 사실상 이 값이 정한다.**

    아래 arrowRoom이 "남는 폭에서 이름 몫을 뺀 나머지"를 전부 가져가므로, 표를 아무리
    줄여도 그 폭은 화살표로 갈 뿐 이름은 늘 이만큼만 받는다. 폰에서 이름을 키우려면
    여기를 올려야 한다 (실측: 0.20에서 이름 0.345, 0.28에서 0.55).

    0.28을 넘기면 이름은 더 안 커지고(화살표가 최소 폭에 걸린다) 화살표만 작아진다.
  */
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
  /*
    **좁은 판에서는 이름 자간을 좁힌다.**

    이 보드의 글자는 0.2em으로 벌려 쓰는데, 일곱 글자짜리 성이면 자간만으로 1.4em을
    쓴다 — 이름 칸의 4분의 1이다. 칸이 빠듯한 폰에서는 그 폭이 고스란히 글자 크기에서
    빠져나간다. 자간을 좁히면 화살표에서도 표에서도 폭을 뺏지 않고 글자만 커진다.

    Bebas Neue는 원래 좁고 촘촘한 서체라 이 정도로 붙여도 뭉쳐 보이지 않는다.
    넓은 판(PC)은 폭이 남으니 원래 자간을 그대로 쓴다.
  */
  const nameTrack = narrow ? '0.06em' : '0.2em';
  setSpacing(ctx, nameTrack);

  /*
    **내용 크기대로 묶어 가운데에 세운다.** 남는 폭을 이름 칸이 다 가져가면 글자가 칸
    한가운데 놓여 화살표와 멀어지고, 폰처럼 좁은 판에서는 칸에 맞추느라 글자만 작아진다.
    이름 칸을 글자 너비에 맞춰 잡고, 다섯 조각을 붙여 세운 뒤 통째로 가운데로 민다.
  */
  let fName = texH * 0.9;
  ctx.font = font(fName);
  let widest = Math.max(ctx.measureText(into).width, ctx.measureText(out).width);

  // 다 붙여도 판을 넘으면 그때 이름을 줄인다 — 줄이는 건 마지막 수단이다
  const nameRoom = (usableW - tagW - arrowW * 2) / 2 - texH * 0.2;
  if (widest > nameRoom && widest > 0) {
    fName *= nameRoom / widest;
    ctx.font = font(fName);
    widest = Math.max(ctx.measureText(into).width, ctx.measureText(out).width);
  }

  const nameW = Math.max(0, widest) + texH * 0.2;
  const blockW = nameW * 2 + arrowW * 2 + tagW;
  const x0 = Math.max(0, (texW - blockW) / 2);

  // 자리 (다 도착했을 때)
  const xNameIn = x0;
  const xArrowL = x0 + nameW;
  const xTag = xArrowL + arrowW;
  const xArrowR = xTag + tagW;
  const xNameOut = xArrowR + arrowW;
  const mid = xTag + tagW / 2;

  // 흰 바탕은 처음부터 제자리다. 무리만 좌우에서 들어온다
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, texW, texH);

  const eased = 1 - Math.pow(1 - Math.min(1, Math.max(0, phase)), 3);
  const shift = (1 - eased) * (blockW / 2 + x0);

  ctx.globalAlpha = eased;

  // ── 왼쪽 무리: 들어오는 선수 · >>> · 초록 쐐기 ──
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

  // ── 오른쪽 무리: 빨강 쐐기 · <<< · 나가는 선수 ──
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

  // 두 색 사이의 흰 사선. 빨강 무리가 들고 들어와 초록에 맞대는 변이다 —
  // 초록과 빨강이 맞닿으면 경계가 탁해 보이는데, 흰 선을 끼우면 `/`가 한 획으로 읽힌다
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

  /*
    안쪽 여백은 글자 크기에 비례하되 **칸 폭에 비해 과하면 안 된다.**

    아래 fillText의 maxW로 넘어가는 값이라, 여백이 칸에 남는 여유보다 크면 캔버스가
    글자를 그 폭에 맞춰 가로로 눌러 버린다. 교체 보드처럼 칸을 글자 너비에 딱 맞춰 잡는
    곳에서는 fontPx * 0.5가 늘 여유보다 커서, 이름도 화살표도 눌린 채로 그려지고 있었다
    (폰에서 유독 작아 보이던 이유다 — 크기가 아니라 폭이 깎였다).

    칸이 넉넉하면 예전과 같은 값이고, 빠듯할 때만 여백이 줄어든다.
  */
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
  /** 글자 대신 라리가 표기(LALIGA + EA 동그라미)가 들어가는 칸 */
  laliga?: boolean;
  /** 챔피언스리그 판 — 밤하늘 배경에 흰 글자 */
  ucl?: boolean;
  /** 한 줄 안에서 서체가 다른 토막들 (RIYADH AIR + METROPOLITANO) */
  segments?: Segment[];
  /** 이 칸의 어느 쪽 끝에 흰 세로 바를 세울지 */
  bar?: 'left' | 'right';
}

/** 한 줄 안에서 서체·자간이 따로 노는 토막 */
interface Segment {
  text: string;
  fontCss?: string;
  track?: number;
}

/**
 * 경기장 이름을 두 토막으로 쪼갠다 — **마지막 낱말만 보드 서체로 남기고 앞은 항공사 서체.**
 * "RIYADH AIR" / "METROPOLITANO"가 그것이다. 낱말이 하나뿐인 이름이면 쪼개지 않는다.
 *
 * 킥오프 전 보드와 경기 중 보드가 같은 경기장 판을 쓰므로 여기 한 곳에만 둔다.
 */
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

/** 토막마다 서체가 다르므로 폭도 각자의 서체로 재서 더한다 */
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

/**
 * 토막들을 칸 가운데에 이어 붙인다.
 *
 * 한 번에 그릴 수 없으므로 폭을 먼저 다 재서 전체를 가운데에 놓고 왼쪽부터 붙여 나간다.
 */
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

/**
 * 챔피언스리그 판 — 대회 고유의 밤하늘에 흰 글자.
 *
 * 파랑 하나로 채우면 그냥 파란 판이라 옆의 스코어 판과 구분이 안 된다. **짙은 남색을 깔고
 * 글자 뒤에서 밝은 파랑이 번지게** 두 번 칠한다 — 그 겹침이 깊이를 만들어 우주로 읽힌다.
 *
 * 라리가 칸과 마찬가지로 양 끝에 흰 바를 세운다. 이 판은 어두워서 밝은 이웃 판과
 * 그냥 붙여 두면 경계가 번져 보인다.
 */
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

  // 1. 밤하늘 — 위가 가장 짙고 아래로 갈수록 풀린다
  const night = ctx.createLinearGradient(x, 0, x, h);
  night.addColorStop(0, UCL_DEEP);
  night.addColorStop(1, '#071a4d');
  ctx.fillStyle = night;
  ctx.fillRect(x, 0, w, h);

  // 2. 아래에서 올라오는 빛.
  //    처음엔 글자 뒤에 크게 깔았더니 밝은 파랑이 판을 다 덮어서 옆의 스코어 판과
  //    구분이 안 됐다 — 좁게, 아래쪽에서만 번지게 두어야 남색이 살아남는다.
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

/**
 * 라리가 칸 — 흰 판에 빨간 LALIGA, 그 옆에 빨간 동그라미 안의 흰 EA.
 *
 * 실물 보드에서 리그 로고가 붙는 자리다. 로고 이미지는 상표라 못 쓰지만 글자와 동그라미로
 * 옮기는 것은 문제가 없다 — 이 파일이 구단 엠블럼 대신 약칭을 쓰는 것과 같은 이유다.
 *
 * EA만 자간을 0으로 되돌린다. 자간은 마지막 글자 뒤에도 붙어서, 그대로 두면 가운데 정렬한
 * 글자가 동그라미 안에서 왼쪽으로 밀린다.
 *
 * 양 끝에 세로 바는 세우지 않는다. 좌우 이웃이 둘 다 파란 판(경기장·홈 득점)이라
 * 흰 판이 그 자체로 갈라져 보인다 — 바를 세우면 가르는 게 아니라 조이기만 한다.
 */
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
  /*
    **획을 덧대지 않는다.**

    전에는 빨간 동그라미가 아니라 흰 동그라미에 빨간 EA였고, 어두운 글자는 밝은 바탕에서
    실제보다 가늘어 보여서 획을 덧대 보정했다. 색을 뒤집은 지금은 정반대다 — 밝은 글자가
    어두운 바탕에서 번져 굵어 보이므로, 덧대면 두 배로 두꺼워진다.

    Bebas Neue는 400 한 종뿐이라(위 [font] 주석 참고) 이게 낼 수 있는 가장 가는 획이다.
  */
  ctx.fillText('EA', cx, h * 0.52, dot * 0.82);
  setSpacing(ctx, '0.06em');
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

  // Bebas Neue는 좁고 높은 서체라 같은 판을 채우는 데 더 큰 크기가 필요하다.
  //
  // 한 번 글자를 판 높이에 닿을 만큼 키워봤다가(fMain 0.86, fNum 1.0) 되돌렸다 —
  // 판이 그만큼 넓어져서 폰에서는 스코어 묶음 말고는 화면에 들어오지 않았다.
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

  /**
   * 리그 칸 — 예전에는 여기가 빈 흰 칸이었다.
   *
   * 라리가면 실물 보드처럼 빨간 판에 LALIGA + EA 동그라미로 간다. 다른 대회는 로고를
   * 흉내 낼 근거가 없으니 지금까지처럼 흰 판에 대회명을 적는다.
   */
  const isLaliga = spec.competition.startsWith(LALIGA_WORDMARK);
  // 챔스는 대회명을 그대로 띄운다 — 라리가처럼 줄여 쓸 표기가 없다
  const isUcl = spec.competition.includes(UCL_MARK);

  const league = (): Cell =>
    isLaliga
      ? {
          // 글자 + 사이 + EA 동그라미 + 양옆 흰 여백.
          // 여백은 pad 1.6배 → 3.2배 → 4.8배로 두 번 늘렸다. 판을 흰색으로 뒤집으면서
          // 글자가 판 끝에 붙어 보이던 게 도드라져서 한 번 더 벌렸다.
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

  /**
   * 경기장 판 — 킥오프 전 보드와 같은 디자인이다(파란 판, 흰 글자, 항공사 이름만 다른 서체).
   * 리그 칸 바로 옆이 이 자리다. 구단명은 양 끝 칸으로 밀려난다.
   */
  const venue = (bar: 'left' | 'right'): Cell => {
    const segments = venueSegments(spec.venue, fLeague);
    return {
      // 바깥쪽 끝에 흰 바 하나 — 그 너머가 빨간 구단 판이라 없으면 두 판이 붙어 보인다.
      // 바가 차지하는 만큼 폭을 더해야 글자가 안쪽으로 밀리지 않는다.
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

  // 남는 폭이 있으면 양 끝을 구단 이름으로 채운다. 글자는 안쪽에 붙여
  // 바깥으로 이어지는 것처럼 자른다.
  if (remainder > 0) {
    const half = remainder / 2;
    cells.unshift({ w: half, bg: BOARD_RED, text: club, color: white, font: fMain, align: 'right' });
    cells.push({ w: half, bg: BOARD_RED, text: club, color: white, font: fMain, align: 'left' });
  }

  // 폭이 모자라면 음수에서 시작해 좌우로 똑같이 넘친다 —
  // 시계가 텍스처 정중앙에 남아야 화면 정중앙에 선다.
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
    // 항공사 이름만 서체가 다르다 — 실물 보드의 그 표기다
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

  const textCell = (d: PreDesign): PreCell => {
    const fontPx = texH * d.size;
    setSpacing(ctx, `${d.track}em`);
    ctx.font = font(fontPx);

    const segments = d.leadBold && d.text ? venueSegments(d.text, fontPx) : undefined;

    // 토막마다 서체가 다르면 폭도 각자의 서체로 재야 한다 —
    // 보드 서체로 한 번에 재면 실제로 그려지는 폭과 어긋나 글자가 판 밖으로 나간다.
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
      drawSegments(ctx, x, c.w, texH, c.segments, c.color, c.font, c.track);
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
/**
 * 관리자 문구 — 남색 판에 흰 글씨 한 벌.
 *
 * 골처럼 터지지 않고 교체처럼 담담하게 간다. 글자 크기를 골(0.86)보다 낮춰 잡는 이유는
 * 한글이 섞이기 때문이다 — 라틴 대문자와 달리 한글은 네모칸을 꽉 채워서 같은 크기로는 판에 닿는다.
 */
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
  setSpacing(ctx, '0.08em'); // 캔버스 크기를 바꾸면 컨텍스트 상태가 초기화된다
  ctx.clearRect(0, 0, texW, texH);

  panel(ctx, 0, texW, texH, BOARD_BLUE, message, '#ffffff', fontPx);

  return { periodCssW: texW / TEX_SCALE };
}

function paintGoal(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  spec: BoardSpec,
  texH: number
): BoardPaint {
  /*
    득점자 이름은 판 높이를 거의 채운다 — 위아래가 판 끝에 닿을랑 말랑이다.
    골이 터진 순간 화면에 남아야 할 것은 이름이라 함성보다 크게 간다.

    0.86이 상한이다: Bebas Neue의 악센트 붙은 대문자(ÁLVAREZ·GIMÉNEZ·GALÁN)는
    글자 크기의 0.88배를 차지해서, 더 키우면 악센트가 판 윗변에 잘린다(실측).
  */
  const fName = texH * 0.86;
  const fShout = texH * 0.5;
  const pad = texH * 0.7;

  setSpacing(ctx, '0.2em');

  const shout = 'GOOOOOOOL!!!!';
  const name = spec.scorer ? latinPlayer(spec.scorer).toUpperCase() : '';

  // 두 판의 글자 크기가 다르므로 폭도 각자의 크기로 잰다
  ctx.font = font(fShout);
  const wShout = ctx.measureText(shout).width;
  ctx.font = font(fName);
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
    panel(ctx, x, cell, texH, '#ffffff', name, BOARD_BLUE, fName);
    x += cell;
  }

  // 빨간 판 — 양끝 pad 구간에서 흰색으로 빠진다. 글자가 시작되는 지점에서 이미 단색이다
  const ramp = Math.min(pad, cell * 0.4) / cell;
  const grad = ctx.createLinearGradient(x, 0, x + cell, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(ramp, BOARD_RED);
  grad.addColorStop(1 - ramp, BOARD_RED);
  grad.addColorStop(1, '#ffffff');
  panel(ctx, x, cell, texH, grad, shout, '#ffffff', fShout);

  return { periodCssW: texW / TEX_SCALE };
}
