/**
 * LED 보드에 올릴 라틴 표기 — 대회명·팀명·팀 약칭·선수명.
 *
 * 보드는 "직관 온 느낌"을 만드는 장치라 실물 경기장처럼 라틴 표기여야 한다.
 * 화면의 나머지(헤더·말풍선·골 카드)는 한국어 그대로다 — 한국 팬이 읽는 글이니까.
 * 그래서 바꾸는 건 보드 안에서만이고, 그 변환을 전부 이 파일에 모은다.
 *
 * 서버가 라틴 표기를 같이 내려주기 시작하면 이 표들은 지우고 서버 값을 쓰면 된다.
 */

/** 키를 만들 때 쓰는 정규화 — 대소문자·공백·구두점을 무시하고 맞춘다 */
const key = (s: string) => s.trim().toLowerCase().replace(/[^0-9a-z가-힣]/g, '');

const HANGUL = /[가-힣]/;

/* ── 대회 ───────────────────────────────────────────── */

const COMPETITIONS: Record<string, string> = {
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
  // 아틀레티코 — 보드에서 전체 이름이 뜨는 건 사실상 이 팀뿐이다
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

/** 표에 없는 라틴 이름에서 약칭을 만든다 — 단어 첫 글자를 최대 3개까지 */
function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
}

/** 보드에 띄울 팀 전체 이름. 표에 없으면 받은 그대로 (대문자화는 보드가 한다) */
export function latinTeam(team: string): string {
  const raw = team.trim();
  return TEAMS[key(raw)]?.name ?? raw;
}

/**
 * 스코어 묶음에 들어가는 팀 약칭.
 *
 * 실제 보드는 여기에 구단 엠블럼이 붙지만, 엠블럼과 대회 로고는 상표·저작물이라
 * 라이선스 없이 쓸 수 없다. 글자로 팀을 가리키는 건 지시적 사용이라 문제가 없다.
 */
export function latinCode(team: string): string {
  const raw = team.trim();

  const known = TEAMS[key(raw)];
  if (known) return known.code;

  // 표에 없는 한국어 팀 — 초성을 따면 보드에 한글이 뜬다. 상대팀으로만 표기한다.
  if (HANGUL.test(raw)) return 'RIV';

  return initialsOf(raw);
}

/* ── 선수 ───────────────────────────────────────────── */

/**
 * 성(姓)만 올린다. 실제 보드도 그렇고, 흐르는 판에 풀네임을 넣으면
 * 판이 길어져 GOOOOOOOL이 화면에 잘 안 들어온다.
 */
const PLAYERS: Record<string, string> = {
  '훌리안 알바레스': 'J. ÁLVAREZ',
  알바레스: 'J. ÁLVAREZ',
  그리즈만: 'GRIEZMANN',
  소를로트: 'SØRLOTH',
  코케: 'KOKE',
  가야르도: 'GALLARDO',
  갤러거: 'GALLAGHER',
  요렌테: 'LLORENTE',
  '데 파울': 'DE PAUL',
  바리오스: 'BARRIOS',
  리노: 'LINO',
  몰리나: 'MOLINA',
  히메네스: 'GIMÉNEZ',
  르노르망: 'LE NORMAND',
  오블락: 'OBLAK',
};

/** 보드에 올릴 선수 이름. 대문자화는 보드가 한다 */
export function latinPlayer(name: string): string {
  const raw = name.trim();

  // 표에 없으면 받은 그대로 — 이미 라틴 표기일 수도 있고(서버가 그렇게 줄 수 있다),
  // 표에서 빠진 한국어 이름이라면 보드를 비워두는 것보다는 낫다.
  return PLAYERS[raw] ?? raw;
}
