/**
 * 승리 색종이 — 경기를 이기면 방 위로 흰색·빨간색 조각이 쏟아진다.
 *
 * React를 모르는 순수 canvas 2D 렌더러다. 붙이고 떼는 일은 WinConfetti.tsx가 한다.
 * (파일명이 Canvas로 끝나는 건 WinConfetti.tsx와 대소문자만 다른 이름이 되면
 *  대소문자를 구분하지 않는 파일 시스템에서 모듈 해석이 충돌하기 때문이다.
 *  stadiumLightsGL.ts가 GL로 끝나는 것과 같은 이유다.)
 *
 * WebGL이 아니라 canvas 2D인 이유: 조각이 수백 개고, 하나하나가 '회전하며
 * 펄럭이는 사각형'이다. setTransform + fillRect 두 줄이 그 움직임을 그대로
 * 표현하는데, 같은 걸 WebGL로 하려면 인스턴싱 버퍼와 회전 행렬을 셰이더에
 * 넘겨야 한다. 조각이 5,000개를 넘어가면 그때 뒤집히지만, 그 개수면 화면이
 * 안 보인다. (조명 쇼는 반대 경우라 WebGL로 갔다 — stadiumLightsGL.ts 참고)
 *
 * 골 연출과 마찬가지로 rAF는 연출 중에만 돈다. 평상시 비용은 0이다.
 */

/** 초당 뿌리는 조각 수 */
const SPAWN_RATE = 90;

/** 동시에 살아있는 조각 상한 — 느린 기기에서 폭주하지 않게 잠가둔다 */
const MAX_PIECES = 520;

const GRAVITY = 320; // px/s²

/**
 * 앞면/뒷면 색 한 쌍.
 *
 * 뒷면을 따로 두는 건 사실감 때문만이 아니다. 이 방은 배경이 밝은 경기장 사진에
 * 흰 베일까지 덮여 있어서, 흰 조각을 흰색 단색으로 칠하면 그냥 사라진다.
 * 돌면서 어두운 뒷면이 보여야 흰 조각도 눈에 걸린다.
 */
const PALETTE: { front: string; back: string; outline: boolean }[] = [
  { front: '#ffffff', back: '#aab6cb', outline: true },
  { front: '#f8fafc', back: '#9daac1', outline: true },
  { front: '#e0122f', back: '#8d0a1d', outline: false },
  { front: '#cf1126', back: '#7d0a19', outline: false },
];

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  terminal: number;
  rot: number;
  rotSpeed: number;
  flutter: number;
  flutterSpeed: number;
  swayAmp: number;
  swaySpeed: number;
  swayPhase: number;
  front: string;
  back: string;
  outline: boolean;
}

export interface WinConfettiHandle {
  /** 켜면 뿌리기 시작하고, 끄면 뿌리기만 멈춘다 — 남은 조각은 끝까지 떨어진다 */
  setActive(active: boolean): void;
  dispose(): void;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * 캔버스에 색종이를 붙인다.
 *
 * 2D 컨텍스트를 못 얻으면 null을 준다(사실상 없지만, 호출부가 WebGL 쪽과
 * 같은 모양으로 처리할 수 있게 맞춰둔다).
 */
export function createWinConfetti(canvas: HTMLCanvasElement): WinConfettiHandle | null {
  const context = canvas.getContext('2d');
  if (!context) return null;

  // 아래 함수들이 전부 클로저로 잡는다. 좁혀진 타입이 함수 선언 안까지
  // 따라오지 않으므로 여기서 non-null로 한 번 고정해둔다.
  const ctx: CanvasRenderingContext2D = context;

  let pieces: Piece[] = [];
  let disposed = false;
  let rafId: number | null = null;
  let lastFrame = 0;
  let activeFlag = false;

  /** 아직 뿌리지 못하고 쌓인 조각 수 — 프레임이 길어져도 총량이 맞도록 소수로 들고 있는다 */
  let spawnDebt = 0;

  let cssW = 1;
  let cssH = 1;
  let dpr = 1;

  function syncSize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cssW = Math.max(1, canvas.clientWidth);
    cssH = Math.max(1, canvas.clientHeight);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function spawn() {
    const tone = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    pieces.push({
      // 화면 위쪽 바깥에서 시작한다. 좌우로 조금 넘겨 뿌려야 가장자리가 비지 않는다
      x: rand(-0.05, 1.05) * cssW,
      y: rand(-60, -10),
      w: rand(6, 12),
      h: rand(9, 16),
      vx: rand(-30, 30),
      vy: rand(0, 60),
      terminal: rand(150, 290),
      rot: rand(0, Math.PI * 2),
      rotSpeed: rand(-6, 6),
      flutter: rand(0, Math.PI * 2),
      flutterSpeed: rand(3, 7),
      swayAmp: rand(20, 70),
      swaySpeed: rand(1.2, 2.6),
      swayPhase: rand(0, Math.PI * 2),
      front: tone.front,
      back: tone.back,
      outline: tone.outline,
    });
  }

  function clear() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function frame(now: number) {
    rafId = null;
    if (disposed) return;

    // 첫 프레임과 탭 복귀 직후의 큰 점프를 잘라낸다
    const dt = Math.min(now - (lastFrame || now), 50) / 1000;
    lastFrame = now;

    syncSize();

    if (activeFlag && pieces.length < MAX_PIECES) {
      spawnDebt += SPAWN_RATE * dt;
      while (spawnDebt >= 1 && pieces.length < MAX_PIECES) {
        spawnDebt -= 1;
        spawn();
      }
    }

    clear();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.22)';

    const alive: Piece[] = [];
    const floor = cssH + 50;

    for (const p of pieces) {
      p.vy = Math.min(p.vy + GRAVITY * dt, p.terminal);
      p.y += p.vy * dt;

      p.swayPhase += p.swaySpeed * dt;
      p.x += (p.vx + Math.sin(p.swayPhase) * p.swayAmp) * dt;

      p.rot += p.rotSpeed * dt;
      p.flutter += p.flutterSpeed * dt;

      if (p.y > floor) continue; // 바닥 아래로 나갔다 — 버린다
      alive.push(p);

      const cos = Math.cos(p.rot);
      const sin = Math.sin(p.rot);

      // 조각 자신의 가로축만 눌러 3D로 도는 것처럼 보이게 한다.
      // 이 값이 음수인 구간이 뒷면이다.
      const flut = Math.cos(p.flutter);

      // DPR을 행렬에 같이 접어 넣는다 — 따로 scale()을 걸면 조각마다 상태가 하나 더 는다
      ctx.setTransform(
        dpr * cos * flut,
        dpr * sin * flut,
        dpr * -sin,
        dpr * cos,
        dpr * p.x,
        dpr * p.y
      );

      ctx.fillStyle = flut >= 0 ? p.front : p.back;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

      // 흰 조각의 앞면은 밝은 배경에 묻힌다 — 얇은 테두리로 윤곽만 세운다
      if (p.outline && flut >= 0) {
        ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
    }

    pieces = alive;

    if (!activeFlag && pieces.length === 0) {
      // 다 떨어졌다 — 화면을 비우고 루프를 멈춘다. 평상시 비용을 0으로 만드는 자리다
      clear();
      lastFrame = 0;
      spawnDebt = 0;
      return;
    }

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null || disposed) return;
    lastFrame = 0;
    rafId = requestAnimationFrame(frame);
  }

  syncSize();

  return {
    setActive(next: boolean) {
      if (activeFlag === next) return;
      activeFlag = next;
      // 끌 때는 루프를 멈추지 않는다 — 뿌리기만 멈추고 남은 조각은 끝까지 떨어진다.
      // 그 자리에서 지워버리면 색종이가 공중에서 증발한다.
      if (next) start();
    },

    dispose() {
      disposed = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      pieces = [];
    },
  };
}
