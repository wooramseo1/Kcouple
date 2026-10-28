# K-Couple — Connect Hearts Beyond Borders

한국에 거주·여행 중인 외국인과 한국인을 **상호 동의(양방향 Like) 기반**으로 연결하는 데이팅 서비스 MVP입니다.
기획 문서(통합 사업 기획·PRD·기술 설계) v1.0을 기준으로 구현했으며, UI는 Tinder처럼 카드를 스와이프하는 방식입니다.

## 빠른 시작

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 매칭 로직 단위 테스트
npm run build && npm start
```

로그인 화면의 **데모 계정** 버튼으로 바로 체험할 수 있습니다.

> **데모 모드**: `npm run dev`에서는 기본으로 켜지고, `npm start`(운영)에서는 꺼집니다. 데모 프로필이 자동으로 좋아요·답장하는 것은 실제 서비스에서는 기만 행위가 되므로 운영에서는 켜지 마세요.
> 운영 서버에서 데모를 보려면 `DEMO_MODE=true npm start`. 운영 환경변수는 `.env.example`을 참고하세요.
>
> **Google Play 출시**: 절차와 정책 체크리스트는 [`docs/PLAY_STORE.md`](docs/PLAY_STORE.md)에 있습니다.

| 계정 | 비밀번호 | 설명 |
| --- | --- | --- |
| `sam@kcouple.dev` | `demo1234` | 서울 거주 외국인 (한국인 여성 탐색) |
| `jiwoo@kcouple.dev` | `demo1234` | 서울 거주 한국인 (외국인 남성 탐색) |
| `admin@kcouple.dev` | `admin1234` | 운영자 콘솔 (신고 큐·감사 로그) |

시드에는 24명의 데모 프로필(“Demo profile” 배지)이 있으며, 데모 프로필은 일부 확률로 Like를 돌려주고 첫 메시지 몇 개에 자동 응답해 혼자서도 매칭·채팅 흐름을 확인할 수 있습니다.
데이터는 `.data/db.json`(또는 `DATA_DIR`)에 저장되며, 이 파일을 지우면 초기 상태로 돌아갑니다.

## 구현 범위 (PRD §3 P0)

| ID | 기능 | 위치 |
| --- | --- | --- |
| F01 | 이메일 가입·로그인, 약관/개인정보 동의, 성인 확인(만 19세) | `app/(auth)`, `api/auth/*` |
| F02 | 프로필: 닉네임·나이·국적·도시·언어/수준·소개·관심사·사진(최대 6장) | `onboarding`, `me/edit`, `api/profile/*` |
| F03 | 선호: 성별·연령 범위·상대 그룹(한국인/외국인/모두)·관계 목적 | `settings`, `ProfileFields.tsx` |
| F04 | 카드 스와이프 Like/Pass, 상호 Like 시 Match (“It's a Match!”) | `SwipeDeck.tsx`, `api/discover`, `api/swipes` |
| F05 | 매칭 당사자 간 채팅 (폴링 기반 실시간 동기화) | `chat/[id]`, `api/matches/[id]/messages` |
| F06 | 신고(7개 사유)·차단·매칭 해제·탈퇴 | `ReportSheet.tsx`, `api/reports`, `api/users/[id]/block`, `api/account` |
| F07 | 한국어/영어 전체 UI 전환 | `src/i18n` |
| F08 | 운영자 콘솔: 심각도순 신고 큐, 계정 정지/해제, 감사 로그 | `app/admin`, `api/admin/*` |

### UX (Tinder 스타일)
- 카드를 좌우로 드래그하면 회전하며 **LIKE / NOPE** 스탬프가 나타나고, 임계값(110px) 또는 빠른 플릭으로 넘어갑니다.
- 카드 좌/우 탭 → 사진 넘기기, 하단 탭 또는 ↑ 버튼 → 전체 프로필. 키보드 ← → ↑ ↓ 지원.
- 하단 4탭: 탐색 / 매칭 / 채팅 / MY (PRD §5.2), 안 읽은 메시지·새 매칭 배지.
- 매칭 모달에서 바로 첫 메시지 전송.

### 매칭 로직 (PRD §4.1)
`src/lib/matching.ts`
- 필수 필터: 양쪽 활성·성인 확인·프로필 공개, **상호** 성별·연령·그룹 선호, 차단 없음, 이미 처리하지 않은 카드.
- 정렬 점수 = 0.25×지역 + 0.25×관계 목적 + 0.20×언어 + 0.20×관심사 + 0.10×활동성 (연애 성공 확률이 아닌 내부 정렬값).
- 정규화된 사용자 쌍(user1 < user2)으로 Match 중복 방지.

### 안전·개인정보
- 비밀번호 scrypt 해시, httpOnly 세션 쿠키, 모든 API에 Zod 검증·요청 빈도 제한.
- 공개 프로필 응답에서 이메일·생년월일·인증 정보 제외 (나이만 노출).
- 채팅은 활성 Match 당사자만, 차단·정지·해제 시 전송 차단, 링크 전송 차단.
- 사진은 MIME 선언이 아닌 실제 파일 시그니처(JPEG/PNG/WEBP) 검사, 1.5MB·6장 제한, 브라우저에서 1080px 리사이즈.
- 탈퇴 시 프로필·사진·좋아요·메시지 삭제, 신고/감사 기록만 분리 보관.

## 아키텍처

```
Browser / PWA
  └─ Next.js 15 (App Router, TypeScript, Tailwind)
       ├─ Route Handlers (/api/*)  — 인증·권한·비즈니스 로직
       └─ src/lib/db.ts            — 개발용 인메모리 저장소 (+ JSON 스냅샷)
supabase/migrations/0001_init.sql  — 운영용 PostgreSQL 스키마 + RLS + process_swipe() 트랜잭션
```

로컬 실행은 외부 자격 증명 없이 동작하도록 개발용 저장소를 사용합니다. 저장소의 테이블 구조는 Supabase 마이그레이션과 1:1로 대응하므로,
운영 전환 시 `src/lib/services.ts`의 데이터 접근부를 Supabase 클라이언트로 교체하고 다음을 연결하면 됩니다.

- Auth → Supabase Auth, 사진 → 비공개 Storage 버킷 + signed URL, 채팅 폴링 → Supabase Realtime 구독

## 출시 전 남은 과제 (PRD §12.1 Go/No-Go)
- **실질적 성인 확인 수단 연동** — 현재는 생년월일 자기 입력 기반 임시 절차이며 화면에 베타 안내를 표시합니다.
- 개인정보 처리방침·약관 법률 검토 (`/privacy`는 초안), 결혼중개업법 경계 검토.
- 사진 유해성 검토(자동+수동), 이메일 소유 확인, Supabase 이전 및 RLS 통합 테스트.
- 비목표(MVP 제외): AI 번역, GPS, 영상통화, 결제/구독.
