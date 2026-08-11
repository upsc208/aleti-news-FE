/**
 * LED 조명 쇼 — 골이 터지면 지붕 조명이 붉고 분홍빛으로 스탠드를 훑는다.
 *
 * React를 모르는 순수 WebGL 렌더러다. 붙이고 떼는 일은 StadiumLights.tsx가 한다.
 *
 * 그리는 것은 화면을 덮는 삼각형 하나뿐이고, 조명은 전부 프래그먼트 셰이더가
 * 계산한다. 정점은 3개, 드로우콜은 1회다 — 라이브러리를 들일 이유가 없어서
 * 이 파일은 의존성이 없다(번들 증가 0).
 *
 * 배터리에 대하여 — 경기 채팅방은 90분 넘게 켜져 있는 화면이다.
 * 그래서 컨텍스트는 입장할 때 한 번 만들어두되(골 순간에 셰이더를 컴파일하면
 * 하필 그 프레임이 튄다) rAF는 celebrate() 중에만 돈다. 평상시 비용은 0이다.
 */

const FADE_IN_MS = 220;
const FADE_OUT_MS = 900;

/** 배경 흐리게(washed)를 켠 사용자는 가독성을 고른 것이다 — 빛도 같이 죽인다 */
const DIMMED_SCALE = 0.5;

export interface StadiumLightsHandle {
  /** 골 연출 시작/종료. false로 내리면 서서히 꺼진 뒤 rAF가 멈춘다 */
  setActive(active: boolean): void;
  setDimmed(dimmed: boolean): void;
  dispose(): void;
}

/** 화면을 덮는 큰 삼각형 하나. 사각형(정점 4개)보다 싸고 이음매도 없다 */
const QUAD = new Float32Array([-1, -1, 3, -1, -1, 3]);

const VERT_SRC = `
precision mediump float;

attribute vec2 a_pos;

varying vec2 v_uv;

void main() {
  // 화면 좌표로 바꿔둔다. y는 아래로 증가시켜 CSS와 방향을 맞춘다
  v_uv = vec2((a_pos.x + 1.0) * 0.5, (1.0 - a_pos.y) * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision mediump float;

varying vec2 v_uv;

uniform float u_time;    // 초
uniform float u_alpha;   // 실제 밝기 — 배경 흐리게가 반영된 값
uniform float u_env;     // 연출 진행도 0~1 — 밝기와 따로 둔다 (아래 retract 참고)
uniform float u_aspect;  // 가로/세로 — 각도 계산이 찌그러지지 않게 보정

/** 지붕에 걸린 조명 개수. 짝수 번째가 분홍빛, 홀수 번째가 붉은빛이다 */
const int LAMPS = 5;

void main() {
  vec2 uv = v_uv;

  // 각도로 빔을 그리므로 가로세로 비를 살려서 계산해야 한다.
  // 안 그러면 넓은 화면에서 빔이 옆으로 늘어져 부채가 아니라 띠로 보인다.
  vec2 p = vec2(uv.x * u_aspect, uv.y);

  vec3 red = vec3(1.0, 0.10, 0.21);
  vec3 pink = vec3(1.0, 0.38, 0.70);

  // 끝나갈수록 빔을 바깥으로 밀어낸다. 밝기만 내리면 마지막 순간에
  // 채팅 한가운데를 비추던 빔이 그 자리에 그대로 남은 채 흐려진다.
  // u_alpha가 아니라 u_env를 쓰는 이유: 배경 흐리게를 켜면 u_alpha가 절반에서
  // 머무는데, 그걸로 밀면 빔이 내내 바깥으로 벌어진 채 있게 된다.
  float retract = 1.0 - u_env;

  vec3 col = vec3(0.0);

  for (int i = 0; i < LAMPS; i++) {
    float fi = float(i);
    float slot = (fi + 0.5) / float(LAMPS);

    // 조명은 화면 위쪽 바깥에 달려 있다 — 빔이 화면 안에서 시작하면
    // 조명이 공중에 뜬 것처럼 보인다
    vec2 origin = vec2(slot * u_aspect, -0.10);

    // 이웃한 등끼리 위상을 어긋나게 둔다. 같이 움직이면 조명 쇼가 아니라
    // 화면 전체가 좌우로 흔들리는 것처럼 읽힌다
    float phase = fi * 1.7;

    // 왼쪽 등은 왼쪽으로, 오른쪽 등은 오른쪽으로 걷힌다 (가운데 등은 오른쪽)
    float side = step(0.5, slot) * 2.0 - 1.0;
    float dir = sin(u_time * 1.9 + phase) * 0.55 + side * retract * 1.25;

    vec2 d = p - origin;
    float ang = atan(d.x, max(d.y, 0.0001));

    // 빔 — 조준 방향에서 멀어질수록 급히 어두워진다
    float beam = exp(-pow((ang - dir) / 0.19, 2.0));

    float dist = length(d);
    float fall = smoothstep(1.05, 0.02, dist); // 멀리 갈수록 흐려진다
    float flare = exp(-pow(dist / 0.13, 2.0)); // 등 바로 아래는 눈이 부시다

    // 깜빡임은 셔터가 아니라 일렁임 수준으로. 0까지 떨어뜨리면 스트로브가 된다
    float blink = 0.62 + 0.38 * sin(u_time * 4.5 + phase * 2.3);

    vec3 tint = mix(pink, red, mod(fi, 2.0));

    // 빔이 넓어진 만큼 겹치는 곳이 늘어 전체가 밝아진다 — 등당 세기를 낮춘다.
    // 플레어는 조준 방향과 무관해서 지붕에 끝까지 남으므로 엔벨로프를 제곱해 먼저 끈다.
    col += tint * (beam * fall * 0.62 + flare * 0.75 * u_env * u_env) * blink;
  }

  // 빛이 닿는 아래 한계. 끝날수록 위로 걷혀 조명이 꺼지듯 물러난다.
  // (아래쪽은 잔디와 입력창이라 애초에 빛이 내려가면 안 되는 자리다)
  float reach = mix(0.30, 0.72, u_env);
  col *= smoothstep(reach, 0.05, uv.y);

  col = min(col, vec3(1.0));

  // 캔버스가 premultipliedAlpha(기본값)로 합성되므로 색을 미리 곱해 내보낸다.
  // 알파를 밝기에서 뽑아야 빔 바깥이 검은 사각형으로 남지 않는다.
  float a = max(col.r, max(col.g, col.b)) * u_alpha;
  if (a < 0.004) discard;

  gl_FragColor = vec4(col * u_alpha, a);
}
`;

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[stadiumLights] 셰이더 컴파일 실패:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/**
 * 캔버스에 조명 쇼를 붙인다.
 *
 * WebGL을 못 쓰는 환경(구형 기기, 컨텍스트 한도 초과, GPU 차단)에서는 null을 준다.
 * 이때 호출부는 그냥 아무것도 그리지 않으면 된다 — 흔들림·섬광·진동은 CSS와
 * useGoalCelebration이 이미 따로 들고 있으므로 골 연출이 통째로 사라지지는 않는다.
 */
export function createStadiumLights(canvas: HTMLCanvasElement): StadiumLightsHandle | null {
  // WebGL2만 본다 — 셰이더는 GLSL ES 1.00이라 WebGL1에서도 돌지만, 지금 WebGL1만
  // 있고 WebGL2가 없는 브라우저는 사실상 없어서 경로를 둘로 두는 값을 못 한다.
  const ctx = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  });

  // 이미 잃어버린 컨텍스트가 돌아오는 경우가 있다(같은 캔버스에서 컨텍스트를
  // 잃은 적이 있으면 getContext는 그 죽은 것을 그대로 준다). 조용히 포기한다.
  if (!ctx || ctx.isContextLost()) return null;

  // 아래 함수들이 전부 클로저로 gl을 잡는다. 좁혀진 타입이 함수 선언 안까지
  // 따라오지 않으므로 여기서 non-null로 한 번 고정해둔다.
  const gl: WebGL2RenderingContext = ctx;

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  let disposed = false;
  let contextLost = false;
  let rafId: number | null = null;
  let lastFrame = 0;

  let activeFlag = false;
  let dimmed = false;
  let alpha = 0; // 페이드 엔벨로프 0~1
  let clock = 0;

  function buildProgram(): boolean {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    if (!prog) return false;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);

    // 링크가 끝나면 셰이더 객체 자체는 더 필요 없다
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('[stadiumLights] 프로그램 링크 실패:', gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return false;
    }

    program = prog;
    gl.useProgram(program);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    uniforms = {
      time: gl.getUniformLocation(program, 'u_time'),
      alpha: gl.getUniformLocation(program, 'u_alpha'),
      env: gl.getUniformLocation(program, 'u_env'),
      aspect: gl.getUniformLocation(program, 'u_aspect'),
    };

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // 프래그먼트가 premultiplied로 나온다
    gl.clearColor(0, 0, 0, 0);

    return true;
  }

  /**
   * 캔버스 픽셀 크기를 CSS 크기에 맞춘다.
   *
   * 뷰포트와 u_aspect는 크기가 그대로여도 매번 다시 건다 — 컨텍스트를 잃었다
   * 복구하면 GL 상태가 전부 초기화되는데, 그때 캔버스 크기는 바뀌지 않아서
   * "달라졌을 때만" 걸면 뷰포트가 0인 채로 살아난다.
   */
  function syncSize() {
    // 조명은 부드러운 그라디언트라 해상도를 다 쓸 이유가 없다. 1.5배에서 자른다
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const cssW = Math.max(1, canvas.clientWidth);
    const cssH = Math.max(1, canvas.clientHeight);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    if (uniforms.aspect) gl.uniform1f(uniforms.aspect, cssW / cssH);
  }

  function frame(now: number) {
    rafId = null;
    if (disposed || contextLost || !program) return;

    // 첫 프레임과 탭 복귀 직후의 큰 점프를 잘라낸다
    const dt = Math.min(now - (lastFrame || now), 50);
    lastFrame = now;
    clock += dt / 1000;

    const target = activeFlag ? 1 : 0;
    const step = dt / (activeFlag ? FADE_IN_MS : FADE_OUT_MS);
    alpha += Math.sign(target - alpha) * Math.min(step, Math.abs(target - alpha));

    if (alpha <= 0 && !activeFlag) {
      // 다 꺼졌다 — 화면을 비우고 루프를 멈춘다. 여기가 평상시 비용을 0으로 만드는 자리다
      gl.clear(gl.COLOR_BUFFER_BIT);
      lastFrame = 0;
      return;
    }

    syncSize();
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform1f(uniforms.time, clock);
    gl.uniform1f(uniforms.env, alpha);
    gl.uniform1f(uniforms.alpha, alpha * (dimmed ? DIMMED_SCALE : 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null || disposed || contextLost || !program) return;
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }

  function onLost(e: Event) {
    // preventDefault를 해야 나중에 restored가 온다
    e.preventDefault();
    contextLost = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
    rafId = null;
    program = null;
    buffer = null;
  }

  function onRestored() {
    if (disposed) return;
    contextLost = false;
    if (buildProgram()) {
      syncSize();
      if (activeFlag || alpha > 0) start();
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

  // 멈춰 있는 동안에는 다시 그릴 것이 없다 — 다음 프레임이 알아서 새 크기를 쓴다
  const ro =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (!disposed && !contextLost) syncSize();
        })
      : null;
  ro?.observe(canvas);

  return {
    setActive(next: boolean) {
      if (activeFlag === next) return;
      activeFlag = next;
      if (next) {
        // 골마다 조명이 같은 자리에서 시작해야 한다. 이어서 돌면 골이 터진 순간
        // 빔이 어디를 비추고 있을지가 매번 달라진다
        clock = 0;
        start();
      }
      // 끄는 쪽은 루프가 알아서 페이드아웃하고 스스로 멈춘다
    },

    setDimmed(next: boolean) {
      dimmed = next;
    },

    dispose() {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      ro?.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      buffer = null;
      program = null;
      // WEBGL_lose_context로 컨텍스트를 즉시 반납하지는 않는다.
      // loseContext()는 컨텍스트가 아니라 '캔버스'를 잃은 상태로 만들어서,
      // 같은 캔버스에 다시 getContext를 해도 죽은 것이 돌아온다.
      // StrictMode가 마운트를 두 번 돌리는 개발 모드에서 이게 그대로 터진다.
      // 캔버스가 함께 사라지므로 컨텍스트는 GC가 알아서 걷어간다.
    },
  };
}
