/**
 * WebGL LED 링 보드 — 진짜 곡면.
 *
 * CSS 보드(LedStrip)가 못 하는 한 가지를 한다: 원근 압축.
 * CSS transform은 평면만 매핑해서, 맞은편(화면 가운데) 글자를 좁게 만들 수가 없다.
 * 여기서는 원통 조각을 실제로 세우고 투영하므로 가운데 글자가 저절로 눌린다.
 *
 * 구조:
 *   1. 보드 내용을 오프스크린 canvas 2D에 굽는다 (ledBoardPainter.ts)
 *   2. 그걸 텍스처로 올린다 — 점수·시계·득점자가 바뀔 때만
 *   3. 원통 조각 메시에 입힌다 (정점 ~194개, 드로우콜 1회)
 *   4. 흐르는 것은 UV 오프셋 uniform — 매 프레임 하는 일은 이것뿐이다
 *
 * 그래서 평상시(idle)에는 rAF가 아예 돌지 않는다. 한 프레임 그리고 멈춘다.
 */

import { boardFontStack, paintBoard } from './ledBoardPainter';
import { sameSpec, type BoardSpec } from './boardModel';

/** 가로로 쪼개는 기둥 수. 많을수록 곡면이 매끈하지만 정점이 는다 */
const COLUMNS = 96;

/**
 * 곡률을 정하는 세 상수.
 *
 * 세기는 카메라와 링 표면의 거리(CAM_DIST)가 정한다. 멀리 두면 원근이 사라져
 * 그냥 평평한 띠가 되고, 가까이 붙일수록 맞은편이 급격히 작아진다.
 * 지금 값은 맞은편(화면 가운데)이 양끝의 세로 65% / 가로 47% 크기로 보인다.
 * 세로 65%는 CSS 보드가 마스크로 깎아둔 60%와 거의 같다 — 실루엣은 그대로 두고
 * 가로 압축만 새로 얻은 셈이다. 더 벌리면 가운데 스코어가 읽기 어려워진다.
 */
const ARC = 2.0;       // 보이는 호의 각도(rad) — 115°쯤
const RADIUS = 1.0;
const CAM_DIST = 0.3;  // 카메라에서 가장 가까운 링 표면까지

/** 보드 높이 (링 반지름과 같은 단위) */
const BAND_H = 0.3;

/**
 * 카메라 눈높이. 보드 윗변(-BAND_H/2)과 아랫변(+BAND_H/2) 사이에 있어야
 * 윗변은 살짝, 아랫변은 깊게 휘는 형태가 나온다 — CSS 보드가 마스크로 흉내내던 그 모양이다.
 * 눈높이가 보드 바깥으로 나가면 위아래가 같은 방향으로 휘어 띠가 그냥 기울어 보인다.
 */
const EYE_Y = -0.09;

/** 펼친 띠는 화면 폭보다 길다. 텍스처를 그만큼 넉넉히 굽는다 */
const UNROLL_RATIO = 1.15;

/** 골 연출 때 흐르는 속도 (CSS px/초) */
const SCROLL_PX_PER_SEC = 130;

/**
 * 킥오프 전 보드가 흐르는 속도 (CSS px/초).
 *
 * 골보다 한참 느리다. 이건 사건이 아니라 배경이라, 눈이 따라가지 않아도 되는 속도여야 한다.
 */
const PRE_SCROLL_PX_PER_SEC = 42;

/**
 * 킥오프 전 보드는 초당 30장이면 충분하다.
 *
 * 이 화면은 킥오프 한 시간 전부터 계속 떠 있다. 42px/초짜리 움직임에 60fps를 쓰는 건
 * 폰 배터리를 태우는 것 말고 하는 일이 없다 — 골 연출은 짧고 세야 하니 그대로 60fps다.
 */
const PRE_FRAME_MS = 32;

/**
 * 움직임을 줄여달라고 해둔 사람에게는 킥오프 전 보드를 세워둔다.
 *
 * 골 연출은 몇 초짜리 사건이지만 이 보드는 한 시간을 흐른다 — 화면 위에서 계속 움직이는
 * 것을 못 견디는 사람에게는 그게 문제다. CSS 보드도 같은 질의로 애니메이션을 끈다.
 */
const prefersStill = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 이 화면이 흐르는가 */
const scrolls = (mode: BoardSpec['mode']) =>
  mode === 'goal' || (mode === 'pre' && !prefersStill());

export interface LedRingHandle {
  /** 보드에 그릴 내용. 같은 값이면 텍스처를 다시 굽지 않는다 */
  setSpec(spec: BoardSpec): void;
  dispose(): void;
}

const VERT_SRC = `
precision mediump float;

attribute vec2 a_pos;   // 이미 투영된 클립 좌표 (곡면 계산은 CPU가 한다)
attribute vec2 a_uv;    // x: 화면 가로 0~1, y: 보드 세로 0~1

uniform float u_uScale;
uniform float u_uOffset;

varying vec2 v_uv;
varying float v_col;

void main() {
  v_uv = vec2(a_uv.x * u_uScale + u_uOffset, a_uv.y);
  v_col = a_uv.x;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;

varying vec2 v_uv;
varying float v_col;

uniform sampler2D u_tex;
uniform float u_dpr;

void main() {
  vec4 c = texture2D(u_tex, v_uv);
  if (c.a < 0.01) discard;

  // 거리감 — 링의 맞은편(화면 가운데)이 가장 멀어 어둡게 가라앉는다
  float far = 1.0 - abs(v_col - 0.5) * 2.0;
  float depth = mix(1.06, 0.84, far);

  // 입체 — 올려다보므로 윗면은 그늘이 지고 앞으로 나온 아랫단은 빛을 받는다
  float form = mix(0.80, 1.14, v_uv.y);

  // LED 도트 격자. CSS 보드가 배경 이미지로 흉내내던 것인데,
  // 여기서는 곡면을 따라 같이 휘므로 판에 붙어 있는 것으로 읽힌다
  float gx = 0.5 + 0.5 * cos(gl_FragCoord.x * 3.14159265 / u_dpr);
  float gy = 0.5 + 0.5 * cos(gl_FragCoord.y * 3.14159265 / u_dpr);
  float grid = 1.0 - 0.09 * gx * gy;

  vec3 rgb = clamp(c.rgb * depth * form * grid, 0.0, 1.0);
  gl_FragColor = vec4(rgb * c.a, c.a);
}
`;

/**
 * 보드 서체(Bebas Neue)를 확실히 올린다.
 *
 * 캔버스에 ctx.font를 지정하는 것만으로는 웹폰트를 내려받지 않는다.
 * 게다가 텍스처는 한 번 굽고 끝이라, 폰트가 늦게 도착해도 저절로 갱신되지 않는다 —
 * 로드가 끝나면 다시 구워야 한다. 실패하면 폴백 글꼴로 그려진 채로 둔다.
 */
function loadBoardFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return document.fonts
    .load(`400 40px ${boardFontStack()}`)
    .then(() => undefined)
    .catch(() => undefined);
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[ledRing] 셰이더 컴파일 실패:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * 원통 조각을 투영해 정점 배열을 만든다.
 *
 * 카메라를 원점에 두고 +z를 본다. 링 중심은 (0, 0, CAM_DIST)이고 반지름은 RADIUS다.
 * 각도 0(화면 가운데)이 가장 멀고 양끝이 가깝다 — 스탠드에서 맞은편 보드를 보는 배치다.
 *
 * 마지막에 전체를 요소 상자에 꽉 차게 정규화한다. 위 상수들을 만져도
 * 보드가 상자 밖으로 나가거나 여백이 생기지 않는다.
 */
function buildMesh(): Float32Array {
  const sx: number[] = [];
  const yTop: number[] = [];
  const yBot: number[] = [];

  for (let i = 0; i <= COLUMNS; i++) {
    const u = i / COLUMNS;
    const theta = (u - 0.5) * ARC;

    const wx = RADIUS * Math.sin(theta);
    const wz = CAM_DIST + RADIUS * Math.cos(theta); // theta=0에서 최대 = 가장 멂
    const s = 1 / wz;

    sx.push(wx * s);
    yTop.push((-BAND_H / 2 - EYE_Y) * s);
    yBot.push((BAND_H / 2 - EYE_Y) * s);
  }

  const minX = Math.min(...sx);
  const maxX = Math.max(...sx);
  const minY = Math.min(...yTop);
  const maxY = Math.max(...yBot);

  const nx = (v: number) => ((v - minX) / (maxX - minX)) * 2 - 1;
  // 화면 y는 아래로 증가하지만 클립 y는 위로 증가한다
  const ny = (v: number) => 1 - ((v - minY) / (maxY - minY)) * 2;

  // TRIANGLE_STRIP — 기둥마다 위/아래 정점을 번갈아 넣으면 사각형이 이어진다
  const data = new Float32Array((COLUMNS + 1) * 2 * 4);
  let p = 0;
  for (let i = 0; i <= COLUMNS; i++) {
    const u = i / COLUMNS;
    data[p++] = nx(sx[i]);
    data[p++] = ny(yTop[i]);
    data[p++] = u;
    data[p++] = 0;

    data[p++] = nx(sx[i]);
    data[p++] = ny(yBot[i]);
    data[p++] = u;
    data[p++] = 1;
  }
  return data;
}

export function createLedRing(canvas: HTMLCanvasElement): LedRingHandle | null {
  const ctx = canvas.getContext('webgl2', {
    alpha: true,
    antialias: true,
    depth: false,
    stencil: false,
    /*
      이 보드는 평상시 한 장 그리고 rAF를 멈춘다(그게 이 화면의 비용을 0으로 만드는 방식이다).
      그런데 기본값(false)이면 브라우저가 합성한 뒤 드로잉 버퍼를 비워버려서,
      다시 그리기 전까지 보드가 사라진다 — 시계가 갱신되는 1초마다 깜빡이게 된다.
      매 프레임 다시 그리는 골 모드에서는 드러나지 않아 놓치기 쉬운 함정이다.
      912×56짜리 캔버스를 초당 한 번 그리는 용도라 유지 비용은 무시할 만하다.
      (조명 쇼는 반대다 — 꺼질 때 비워져야 하므로 false가 맞다)
    */
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  if (!ctx || ctx.isContextLost()) return null;

  // 아래 함수들이 전부 클로저로 잡는다 — 좁혀진 타입이 함수 선언 안까지 따라오지 않는다
  const gl: WebGL2RenderingContext = ctx;

  const mesh = buildMesh();
  const vertexCount = (COLUMNS + 1) * 2;

  /** 텍스처를 굽는 오프스크린 캔버스. 화면에 붙지 않는다 */
  const scratch = document.createElement('canvas');

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  let disposed = false;
  let contextLost = false;
  let rafId: number | null = null;
  let lastFrame = 0;

  let spec: BoardSpec | null = null;
  let periodCssW = 1;
  let uScale = 1;
  let uOffset = 0;
  let dpr = 1;
  let cssW = 1;
  let cssH = 1;

  function buildProgram(): boolean {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[ledRing] 프로그램 링크 실패:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return false;
    }

    program = prog;
    gl.useProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);

    const stride = 4 * 4;
    const aPos = gl.getAttribLocation(program, 'a_pos');
    const aUv = gl.getAttribLocation(program, 'a_uv');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, stride, 8);

    texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 가운데가 눌리면서 텍스처가 축소되므로 밉맵이 필요하다 — 없으면 글자가 지글거린다
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 골 연출은 한 벌을 반복해서 흘린다
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    uniforms = {
      uScale: gl.getUniformLocation(program, 'u_uScale'),
      uOffset: gl.getUniformLocation(program, 'u_uOffset'),
      tex: gl.getUniformLocation(program, 'u_tex'),
      dpr: gl.getUniformLocation(program, 'u_dpr'),
    };
    gl.uniform1i(uniforms.tex, 0);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // 프래그먼트가 premultiplied로 나온다
    gl.clearColor(0, 0, 0, 0);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    return true;
  }

  function syncSize(): boolean {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextW = Math.max(1, canvas.clientWidth);
    const nextH = Math.max(1, canvas.clientHeight);
    const changed = nextW !== cssW || nextH !== cssH;
    cssW = nextW;
    cssH = nextH;

    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    if (uniforms.dpr) gl.uniform1f(uniforms.dpr, dpr);
    return changed;
  }

  /** 텍스처를 다시 굽고 올린다. 내용이나 크기가 바뀔 때만 부른다 */
  function bake() {
    if (!spec || !texture) return;

    const paint = paintBoard(scratch, spec, cssW * UNROLL_RATIO, cssH);
    if (!paint) return;

    periodCssW = Math.max(1, paint.periodCssW);
    // 펼친 띠를 이 텍스처 몇 벌로 채우나
    uScale = (cssW * UNROLL_RATIO) / periodCssW;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  function draw() {
    if (!program) return;
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.uScale, uScale);
    gl.uniform1f(uniforms.uOffset, uOffset);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, vertexCount);
  }

  function frame(now: number) {
    rafId = null;
    if (disposed || contextLost || !program) return;

    const pre = spec?.mode === 'pre';

    // 킥오프 전 보드는 프레임을 솎는다. 건너뛴 프레임의 시간은 lastFrame을 그대로 둬서
    // 다음 장에 합산된다 — 솎아도 흐르는 속도는 같다.
    if (pre && now - lastFrame < PRE_FRAME_MS && lastFrame) {
      rafId = requestAnimationFrame(frame);
      return;
    }

    const dt = Math.min(now - (lastFrame || now), 50) / 1000;
    lastFrame = now;

    if (syncSize()) bake();

    // 한 벌이 지나가는 데 걸리는 시간 = periodCssW / 속도.
    // UV는 '한 벌 = 1'이므로 그 역수만큼 오프셋을 민다.
    const speed = pre ? PRE_SCROLL_PX_PER_SEC : SCROLL_PX_PER_SEC;
    uOffset = (uOffset + (dt * speed) / periodCssW) % 1;
    draw();

    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    lastFrame = 0;
  }

  function onLost(e: Event) {
    e.preventDefault();
    contextLost = true;
    stopLoop();
    program = null;
    buffer = null;
    texture = null;
  }

  function onRestored() {
    if (disposed) return;
    contextLost = false;
    if (!buildProgram()) return;
    syncSize();
    bake();
    if (spec && scrolls(spec.mode)) {
      rafId = requestAnimationFrame(frame);
    } else {
      draw();
    }
  }

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  if (!buildProgram()) {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    return null;
  }
  syncSize();

  // 폰트가 도착하면 다시 굽는다. 이때쯤이면 React가 이미 setSpec을 불러둔 상태다
  // (아직이면 bake가 조용히 넘어가고, 곧 올 setSpec이 그때 굽는다).
  loadBoardFont().then(() => {
    if (disposed || contextLost) return;
    bake();
    if (rafId === null) draw();
  });

  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (disposed || contextLost) return;
          if (syncSize()) {
            bake();
            // 골 연출 중이면 다음 프레임이 알아서 그린다
            if (rafId === null) draw();
          }
        })
      : null;
  ro?.observe(canvas);

  return {
    setSpec(next: BoardSpec) {
      if (disposed || contextLost) return;

      const modeChanged = spec?.mode !== next.mode;
      const changed = !sameSpec(spec, next);
      spec = next;

      if (changed) bake();

      // 흐르는 화면은 둘이다: 골 연출과 킥오프 전 보드.
      if (scrolls(next.mode)) {
        if (modeChanged) uOffset = 0; // 골마다, 그리고 보드가 바뀔 때마다 같은 자리에서 시작한다
        if (rafId === null) {
          lastFrame = 0;
          rafId = requestAnimationFrame(frame);
        }
      } else {
        // 경기 중에는 흐르지 않는다 — 한 장 그리고 루프를 멈춘다. 여기가 비용을 0으로 만드는 자리다
        stopLoop();
        uOffset = 0;
        if (changed || modeChanged) draw();
      }
    },

    dispose() {
      disposed = true;
      stopLoop();
      ro?.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
      if (program) gl.deleteProgram(program);
      buffer = null;
      texture = null;
      program = null;
      // loseContext()는 부르지 않는다 — 캔버스를 죽여서 StrictMode 재마운트가 깨진다
      // (stadiumLightsGL.ts에 같은 주석이 있다)
    },
  };
}
