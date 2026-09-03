import React from 'react';

/**
 * 주소로 인정할 글자 — RFC 3986이 URL에 허용하는 ASCII만 담는다.
 *
 * **한글이 빠져 있는 게 핵심이다.** 우리 기사는 "자세한 건 https://t.co/abc에서"처럼
 * 조사가 주소에 바로 붙는다. \S+로 긁으면 '에서'까지 주소로 삼아 링크가 깨진다.
 * 여기 없는 글자를 만나면 주소가 거기서 끝난다.
 */
const URL_RE = /(?:https?:\/\/|www\.)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi;

/** www로 시작하는 후보는 도메인 꼴을 갖췄을 때만 링크로 본다 (그냥 'www.'는 아니다) */
const BARE_WWW_RE = /^www\.[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/i;

/** 주소 뒤에 붙어 온 문장부호 — 주소의 일부가 아니다 */
const TRAILING_PUNCTUATION = '.,;:!?\'"…、。，';

const CLOSERS: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

/**
 * 주소 뒤에 딸려온 문장부호를 떼어 낸다.
 *
 * "...봤다(https://t.co/abc)." 에서 ')'와 '.'은 문장의 것이지 주소의 것이 아니다.
 * 다만 괄호는 주소 안에도 들어간다(위키백과의 Foo_(bar) 같은 것). 그래서 여는 괄호가
 * 안에 있으면 짝이 맞는 것으로 보고 그대로 둔다.
 */
function trimTrailingPunctuation(url: string): string {
  let end = url.length;

  while (end > 0) {
    const ch = url[end - 1];

    if (TRAILING_PUNCTUATION.includes(ch)) {
      end--;
      continue;
    }

    const open = CLOSERS[ch];
    if (open) {
      const slice = url.slice(0, end);
      const opened = slice.split(open).length - 1;
      const closed = slice.split(ch).length - 1;
      // 닫는 쪽이 더 많으면 그 괄호는 문장의 것이다
      if (closed > opened) {
        end--;
        continue;
      }
    }

    break;
  }

  return url.slice(0, end);
}

/**
 * 본문에 글자로만 박혀 있는 주소를 눌러서 갈 수 있는 링크로 바꾼다.
 *
 * **dangerouslySetInnerHTML을 쓰지 않는다.** 기사 본문은 외부에서 들어오는 값이라
 * HTML로 해석시키면 그대로 스크립트가 실행되는 통로가 된다. 문자열을 잘라 React
 * 엘리먼트로 만들면 이스케이프는 React가 알아서 하므로 그 통로가 아예 생기지 않는다.
 *
 * 링크로 만드는 건 http(s)와 www뿐이다. javascript: 같은 다른 스킴은 애초에
 * 후보로 잡히지 않으므로 글자 그대로 남는다.
 *
 * 감싸는 쪽이 whitespace-pre-wrap이라 줄바꿈은 그대로 살아 있다.
 */
export default function Linkify({ text }: { text: string }) {
  if (!text) return null;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  // 매번 새로 뜬다 — /g 정규식은 lastIndex를 들고 다녀서, 하나를 공유하면
  // 앞 호출이 멈춘 자리에서 이어 읽는다. 두 번째 기사부터 앞부분을 건너뛴다.
  const re = new RegExp(URL_RE);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const url = trimTrailingPunctuation(match[0]);
    const isBareWww = /^www\./i.test(url);

    // 주소로 보기 어려우면 손대지 않고 글자로 흘려보낸다
    if (!url || (isBareWww && !BARE_WWW_RE.test(url))) {
      continue;
    }

    if (match.index > cursor) {
      nodes.push(text.slice(cursor, match.index));
    }

    nodes.push(
      <a
        key={`${match.index}-${url}`}
        href={isBareWww ? `https://${url}` : url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="text-aleti-red dark:text-volt underline underline-offset-4 decoration-aleti-red/30 dark:decoration-volt/30 hover:decoration-aleti-red dark:hover:decoration-volt break-all transition-colors"
      >
        {url}
      </a>
    );

    // 떼어 낸 문장부호는 본문 글자로 남아야 한다 — 다음 조각이 거기서 시작한다
    cursor = match.index + url.length;
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor));
  }

  return <>{nodes}</>;
}
