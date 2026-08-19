/**
 * LED 보드에 올릴 라틴 표기 — 대회명·팀명·팀 약칭·선수명.
 *
 * 보드는 "직관 온 느낌"을 만드는 장치라 실물 경기장처럼 라틴 표기여야 한다.
 * 화면의 나머지(헤더·말풍선·골 카드)는 한국어 그대로다 — 한국 팬이 읽는 글이니까.
 * 그래서 바꾸는 건 보드 안에서만이고, 그 변환을 전부 이 파일에 모은다.
 *
 * 서버가 라틴 표기를 같이 내려주기 시작하면 이 표들은 지우고 서버 값을 쓰면 된다.
 */

import { isAtleti } from './boardModel';

/** 키를 만들 때 쓰는 정규화 — 대소문자·공백·구두점을 무시하고 맞춘다 */
const key = (s: string) => s.trim().toLowerCase().replace(/[^0-9a-z가-힣]/g, '');

const HANGUL = /[가-힣]/;

/** 여기는 아틀레티 전용 채팅방이다. 우리 팀 약칭은 무엇을 받든 이 값으로 고정한다 */
const ATLETI_CODE = 'ATM';

/* ── 대회 ───────────────────────────────────────────── */

const COMPETITIONS: Record<string, string> = {
  // 네이버가 실제로 주는 표기 (`categoryName`) — 라이브 스코어가 여기서 온다
  클럽프렌들리: 'CLUB FRIENDLY',
  친선전: 'CLUB FRIENDLY',
  친선경기: 'CLUB FRIENDLY',
  프리시즌: 'PRE-SEASON',
  라리가: 'LALIGA EA SPORTS',
  프리메라리가: 'LALIGA EA SPORTS',
  프리메라리그: 'LALIGA EA SPORTS',
  스페인리그: 'LALIGA EA SPORTS',
  챔피언스리그: 'UEFA CHAMPIONS LEAGUE',
  챔스: 'UEFA CHAMPIONS LEAGUE',
  uefa챔피언스리그: 'UEFA CHAMPIONS LEAGUE',
  유로파리그: 'UEFA EUROPA LEAGUE',
  컨퍼런스리그: 'UEFA CONFERENCE LEAGUE',
  코파델레이: 'COPA DEL REY',
  코파: 'COPA DEL REY',
  국왕컵: 'COPA DEL REY',
  슈퍼컵: 'SUPERCOPA DE ESPAÑA',
  스페인슈퍼컵: 'SUPERCOPA DE ESPAÑA',
  수페르코파: 'SUPERCOPA DE ESPAÑA',
  uefa슈퍼컵: 'UEFA SUPER CUP',
  클럽월드컵: 'FIFA CLUB WORLD CUP',

  // FotMob이 주는 라틴 표기 (`general.leagueName`) — 정식 명칭으로 다듬어 올린다.
  // 표에 없어도 라틴이면 그대로 나가므로 여기 없는 대회도 보드는 정상이다.
  laliga: 'LALIGA EA SPORTS',
  championsleague: 'UEFA CHAMPIONS LEAGUE',
  uefachampionsleague: 'UEFA CHAMPIONS LEAGUE',
  europaleague: 'UEFA EUROPA LEAGUE',
  copadelrey: 'COPA DEL REY',
  clubfriendlies: 'CLUB FRIENDLY',
  supercopa: 'SUPERCOPA DE ESPAÑA',
};

/**
 * 보드에 올릴 대회명.
 *
 * 표에 없는 한국어가 오면 경기장 이름으로 대신한다 — 보드에 한글이 뜨느니
 * 경기장 이름이 낫다(실물 보드도 대회명 자리에 경기장 이름을 자주 돌린다).
 */
export function latinCompetition(competition: string | undefined, venue: string): string {
  const raw = competition?.trim();
  if (!raw) return venue;

  const mapped = COMPETITIONS[key(raw)];
  if (mapped) return mapped;

  return HANGUL.test(raw) ? venue : raw;
}

/* ── 팀 ─────────────────────────────────────────────── */

interface TeamName {
  /** 보드에 띄우는 전체 이름 */
  name: string;
  /** 스코어 묶음의 약칭 */
  code: string;
}

const TEAMS: Record<string, TeamName> = {
  // 아틀레티코 — 보드에서 전체 이름이 뜨는 건 사실상 이 팀뿐이다.
  //
  // **`AT 마드리드`가 서버가 실제로 주는 표기다.** 라이브 스코어는 네이버에서 오는데
  // 네이버는 이렇게 적는다. 이 항목이 없으면 아틀레티가 "표에 없는 한국어 팀"으로 떨어져
  // 약칭이 RIV(상대팀)로, 구단명은 한글 그대로 보드에 나간다.
  'at마드리드': { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  아틀레티코마드리드: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  아틀레티코: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  아틀레띠코마드리드: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  atléticomadrid: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  atleticomadrid: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  atléticodemadrid: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },
  atleticodemadrid: { name: 'ATLÉTICO DE MADRID', code: 'ATM' },

  // 라리가
  레알마드리드: { name: 'REAL MADRID', code: 'RMA' },
  realmadrid: { name: 'REAL MADRID', code: 'RMA' },
  바르셀로나: { name: 'FC BARCELONA', code: 'BAR' },
  fcbarcelona: { name: 'FC BARCELONA', code: 'BAR' },
  barcelona: { name: 'FC BARCELONA', code: 'BAR' },
  세비야: { name: 'SEVILLA FC', code: 'SEV' },
  sevilla: { name: 'SEVILLA FC', code: 'SEV' },
  레알베티스: { name: 'REAL BETIS', code: 'BET' },
  베티스: { name: 'REAL BETIS', code: 'BET' },
  realbetis: { name: 'REAL BETIS', code: 'BET' },
  발렌시아: { name: 'VALENCIA CF', code: 'VAL' },
  valencia: { name: 'VALENCIA CF', code: 'VAL' },
  아틀레틱빌바오: { name: 'ATHLETIC CLUB', code: 'ATH' },
  빌바오: { name: 'ATHLETIC CLUB', code: 'ATH' },
  athleticclub: { name: 'ATHLETIC CLUB', code: 'ATH' },
  레알소시에다드: { name: 'REAL SOCIEDAD', code: 'RSO' },
  소시에다드: { name: 'REAL SOCIEDAD', code: 'RSO' },
  realsociedad: { name: 'REAL SOCIEDAD', code: 'RSO' },
  비야레알: { name: 'VILLARREAL CF', code: 'VIL' },
  villarreal: { name: 'VILLARREAL CF', code: 'VIL' },
  헤타페: { name: 'GETAFE CF', code: 'GET' },
  getafe: { name: 'GETAFE CF', code: 'GET' },
  셀타비고: { name: 'CELTA VIGO', code: 'CEL' },
  오사수나: { name: 'CA OSASUNA', code: 'OSA' },
  마요르카: { name: 'RCD MALLORCA', code: 'MLL' },
  라요바예카노: { name: 'RAYO VALLECANO', code: 'RAY' },
  알라베스: { name: 'DEPORTIVO ALAVÉS', code: 'ALA' },
  에스파뇰: { name: 'RCD ESPANYOL', code: 'ESP' },
  지로나: { name: 'GIRONA FC', code: 'GIR' },

  // 유럽에서 자주 만나는 팀
  맨체스터시티: { name: 'MANCHESTER CITY', code: 'MCI' },
  맨시티: { name: 'MANCHESTER CITY', code: 'MCI' },
  manchestercity: { name: 'MANCHESTER CITY', code: 'MCI' },
  mancity: { name: 'MANCHESTER CITY', code: 'MCI' },
  맨체스터유나이티드: { name: 'MANCHESTER UNITED', code: 'MUN' },
  리버풀: { name: 'LIVERPOOL FC', code: 'LIV' },
  liverpool: { name: 'LIVERPOOL FC', code: 'LIV' },
  아스널: { name: 'ARSENAL FC', code: 'ARS' },
  arsenal: { name: 'ARSENAL FC', code: 'ARS' },
  첼시: { name: 'CHELSEA FC', code: 'CHE' },
  chelsea: { name: 'CHELSEA FC', code: 'CHE' },
  바이에른뮌헨: { name: 'BAYERN MÜNCHEN', code: 'BAY' },
  뮌헨: { name: 'BAYERN MÜNCHEN', code: 'BAY' },
  도르트문트: { name: 'BORUSSIA DORTMUND', code: 'BVB' },
  인터밀란: { name: 'INTER MILAN', code: 'INT' },
  ac밀란: { name: 'AC MILAN', code: 'MIL' },
  유벤투스: { name: 'JUVENTUS', code: 'JUV' },
  나폴리: { name: 'SSC NAPOLI', code: 'NAP' },
  파리생제르맹: { name: 'PARIS SAINT-GERMAIN', code: 'PSG' },
  psg: { name: 'PARIS SAINT-GERMAIN', code: 'PSG' },
  벤피카: { name: 'SL BENFICA', code: 'BEN' },
  포르투: { name: 'FC PORTO', code: 'POR' },
  아약스: { name: 'AFC AJAX', code: 'AJA' },
};

/**
 * 표를 정규화된 키로 미리 펴 둔다.
 *
 * `key()`는 악센트를 지우는데(`é` → 삭제) 표의 키는 `atléticodemadrid`처럼 악센트가 든 채로
 * 적혀 있다. 그대로 조회하면 **영원히 안 맞는다** — 실제로 `ATLÉTICO DE MADRID`가 표를
 * 못 찾고 앞 세 글자를 따 `ATL`로 나왔다.
 */
const TEAM_LOOKUP: Record<string, TeamName> = Object.fromEntries(
  Object.entries(TEAMS).map(([k, v]) => [key(k), v])
);

const lookupTeam = (name: string): TeamName | undefined => TEAM_LOOKUP[key(name)];

/**
 * 표에 없는 라틴 이름에서 약칭을 만든다 — **앞 세 글자.**
 *
 * `Marseille` → MAR, `Villarreal` → VIL 처럼 실제 중계 표기와 대체로 맞는다.
 * 두 단어 첫 글자를 따면(`Real Sociedad` → RS) 두 글자짜리가 섞여 보드 폭이 흔들린다.
 */
function initialsOf(name: string): string {
  const letters = name.replace(/[^0-9A-Za-zÀ-ÿ]/g, '');
  return letters.slice(0, 3).toUpperCase();
}

/**
 * 보드에 띄울 팀 전체 이름.
 *
 * [latin]은 서버가 FotMob에서 가져온 라틴 표기다. 라이브 스코어는 네이버에서 오는데
 * 네이버는 한글로만 주므로(`AT 마드리드`), 이 값이 없으면 아래 표에 기대야 한다.
 */
export function latinTeam(team: string, latin?: string | null): string {
  const given = latin?.trim();
  if (given && !HANGUL.test(given)) return lookupTeam(given)?.name ?? given;

  const raw = team.trim();
  return lookupTeam(raw)?.name ?? raw;
}

/**
 * 스코어 묶음에 들어가는 팀 약칭.
 *
 * 실제 보드는 여기에 구단 엠블럼이 붙지만, 엠블럼과 대회 로고는 상표·저작물이라
 * 라이선스 없이 쓸 수 없다. 글자로 팀을 가리키는 건 지시적 사용이라 문제가 없다.
 *
 * **아틀레티는 어떤 표기로 오든 언제나 `ATM`이다.** 여기는 아틀레티 전용 채팅방이고,
 * 우리 팀 약칭이 소스나 철자에 따라 흔들리면 그건 그냥 버그로 보인다.
 * 나머지는 표에 있으면 그 약칭, 없으면 라틴 이름 앞 세 글자. 한국어 이름밖에 없으면
 * `RIV`(상대팀)로 뭉갠다 — 초성을 따면 보드에 한글이 뜬다.
 */
export function latinCode(team: string, latin?: string | null): string {
  const given = latin?.trim();
  const hasLatin = Boolean(given) && !HANGUL.test(given as string);
  const raw = team.trim();

  if (isAtleti(raw) || (hasLatin && isAtleti(given as string))) return ATLETI_CODE;

  if (hasLatin) return lookupTeam(given as string)?.code ?? initialsOf(given as string);

  const known = lookupTeam(raw);
  if (known) return known.code;

  if (HANGUL.test(raw)) return 'RIV';
  return initialsOf(raw);
}

/* ── 선수 ───────────────────────────────────────────── */

/**
 * 성(姓)만 올린다. 실제 보드도 그렇고, 흐르는 판에 풀네임을 넣으면
 * 판이 길어져 GOOOOOOOL이 화면에 잘 안 들어온다.
 *
 * **26/27 스쿼드 기준이다.** 이적시장이 열릴 때마다 손봐야 하는 유일한 표다 —
 * 다만 서버가 FotMob에서 라틴 표기를 같이 내려주면(latinPlayer의 1순위) 표에 없는
 * 신입도 그냥 되므로, 여기가 비어 있다고 이름이 안 나오는 것은 아니다.
 * 한 명씩 여러 키를 두는 것은 네이버가 같은 선수를 다르게 적기 때문이다.
 */
const PLAYERS: Record<string, string> = {
  // 공격
  알바레스: 'J. ÁLVAREZ',
  쇠를로트: 'SØRLOTH',
  소를로트: 'SØRLOTH',
  루크만: 'LOOKMAN',
  // 한국 이름은 성만 떼면 'LEE'뿐이라 누구인지 안 남는다. 실제 보드 표기대로 붙여 쓴다
  이강인: 'LEE KANG-IN',
  강인: 'LEE KANG-IN',
  시메오네: 'G. SIMEONE',
  마르틴: 'C. MARTÍN',
  카를로스마르틴: 'C. MARTÍN',
  쿠보: 'CUBO',
  미겔쿠보: 'CUBO',

  // 중원
  코케: 'KOKE',
  바리오스: 'BARRIOS',
  바에나: 'BAENA',
  카르도소: 'CARDOSO',
  요렌테: 'LLORENTE',
  휼만: 'HJULMAND',
  율만: 'HJULMAND',
  히울만: 'HJULMAND',
  르마르: 'LEMAR',
  르마: 'LEMAR',
  바르가스: 'VARGAS',
  멘도사: 'MENDOZA',
  멘도자: 'MENDOZA',
  오르티스: 'ORTIZ',
  오르티즈: 'ORTIZ',
  아르나우오르티스: 'ORTIZ',

  // 수비
  르노르망: 'LE NORMAND',
  노르망: 'LE NORMAND',
  히메네스: 'GIMÉNEZ',
  그리말도: 'GRIMALDO',
  로메로: 'ROMERO',
  크리스티안로메로: 'ROMERO',
  푸비: 'PUBILL',
  푸빌: 'PUBILL',
  한츠코: 'HANCKO',
  // 골키퍼
  오블락: 'OBLAK',
  무소: 'MUSSO',
};

/** 표를 정규화된 키로 미리 펴 둔다 — 조회할 때마다 만들 이유가 없다 */
const PLAYER_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(PLAYERS).map(([k, v]) => [key(k), v])
);

/**
 * 이름 앞에 붙어 성의 일부가 되는 조각들.
 *
 * 선수 명단과 달리 **이적시장마다 바뀌지 않는다.** 그래서 이 표는 관리 대상이 아니다.
 */
const PARTICLES = new Set([
  'de', 'del', 'la', 'las', 'le', 'los', 'van', 'von', 'der', 'den',
  'da', 'das', 'dos', 'di', 'mc', 'mac', 'san', 'st', 'ter', 'al',
]);

/**
 * 풀네임에서 성만 뽑는다 — 실제 보드가 성만 띄우고, 흐르는 판에 풀네임을 넣으면
 * 판이 길어져 GOOOOOOOL이 화면에 잘 안 들어온다.
 *
 * 뒤에서부터 훑되 관사(`de`, `le`, `van`…)는 성에 붙여 둔다.
 * `Robin Le Normand` → `Le Normand` (`Normand`가 아니다)
 */
export function surnameOf(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full.trim();

  const isParticle = (t: string) => PARTICLES.has(t.toLowerCase().replace(/\./g, ''));
  // 이미 줄여 둔 이름("J. ÁLVAREZ")을 한 번 더 통과시켜도 이니셜이 떨어지지 않게 한다
  const isInitial = (t: string) => /^[\p{L}]\.$/u.test(t);

  let start = parts.length - 1;
  while (start > 0 && (isParticle(parts[start - 1]) || isInitial(parts[start - 1]))) start--;
  return parts.slice(start).join(' ');
}

/**
 * 보드에 올릴 선수 이름. 대문자화는 보드가 한다.
 *
 * 우선순위:
 *  1. 서버가 준 라틴 표기([latin]) — FotMob의 같은 골에서 가져온 값이라 신입·유스도 그냥 된다
 *  2. 아래 표 — 서버가 못 찾았을 때의 그물
 *  3. 아무것도 안 띄운다 — 보드는 직관 온 느낌을 만드는 장치라 한글이 뜨면 그게 깨진다
 *
 * 2번 표를 찾을 때는 앞 이름을 하나씩 떼어 가며 좁힌다. 서버가 주는 건 풀네임인데
 * ("앙투안 그리즈만") 표는 성 위주라 그대로는 거의 다 빗나가기 때문이다.
 * `key()`가 띄어쓰기를 지우므로 "로빈 르 노르망"과 "르노르망"도 같은 것으로 본다.
 */
export function latinPlayer(name: string, latin?: string | null): string {
  const given = latin?.trim();
  if (given && !HANGUL.test(given)) return surnameOf(given);

  const raw = name.trim();
  if (!raw) return '';

  // "앙투안 그리즈만" → "앙투안그리즈만" → "그리즈만" 순으로 좁혀 간다
  const parts = raw.split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    const hit = PLAYER_LOOKUP[key(parts.slice(i).join(''))];
    if (hit) return hit;
  }

  // 이미 라틴 표기면(FotMob 폴백이 영문 이름을 준다) 성만 떼어 쓴다
  return HANGUL.test(raw) ? '' : surnameOf(raw);
}
