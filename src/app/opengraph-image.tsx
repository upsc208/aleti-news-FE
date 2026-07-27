import { ImageResponse } from 'next/og';

export const alt = '아틀레티 KR (알레띠 KR) | 아틀레티코 마드리드 뉴스 포털';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const RED = '#BF0921';
const NAVY = '#272E75';
const VOLT = '#CCFF00';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: NAVY,
        }}
      >
        {/* 좌측 유니폼 스트라이프 */}
        <div style={{ display: 'flex', height: '100%' }}>
          <div style={{ width: 44, height: '100%', background: RED }} />
          <div style={{ width: 44, height: '100%', background: 'white' }} />
          <div style={{ width: 44, height: '100%', background: RED }} />
          <div style={{ width: 44, height: '100%', background: 'white' }} />
          <div style={{ width: 44, height: '100%', background: RED }} />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            paddingLeft: 80,
            paddingRight: 60,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div style={{ width: 56, height: 8, background: VOLT }} />
            <div
              style={{
                color: VOLT,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: 8,
              }}
            >
              NEWS PORTAL
            </div>
          </div>

          <div
            style={{
              color: 'white',
              fontSize: 160,
              fontWeight: 800,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            ATLETI KR
          </div>

          <div
            style={{
              marginTop: 28,
              color: 'rgba(255,255,255,0.75)',
              fontSize: 36,
              fontWeight: 600,
              letterSpacing: 4,
            }}
          >
            ATLÉTICO DE MADRID
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
