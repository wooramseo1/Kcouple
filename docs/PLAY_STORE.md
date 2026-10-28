# Google Play 출시 가이드

K-Couple은 Next.js 웹앱(PWA)이므로 **Trusted Web Activity(TWA)** 로 감싸서 Play 스토어에 올립니다.
TWA는 Chrome 엔진으로 우리 웹사이트를 주소창 없이 전체 화면으로 띄우는 안드로이드 앱입니다. 웹을 업데이트하면 앱도 바로 바뀌고, 앱 재심사는 필요 없습니다.

```
[Play 스토어 앱 (TWA, .aab)] ──열기──▶ https://내도메인 (Next.js 서버)
         ▲                                   │
         └── /.well-known/assetlinks.json ◀──┘  (앱과 사이트가 같은 소유임을 증명)
```

---

## 0. 출시 전 반드시 해결할 것 (차단 요소)

| # | 항목 | 상태 | 해야 할 일 |
|---|---|---|---|
| 1 | **영구 데이터 저장소** | ⚠️ 미해결 | 지금은 `db.json` 파일 하나에 저장합니다. 영구 디스크에 `DATA_DIR`를 지정하면 소규모 베타는 가능하지만, 정식 출시 전에는 `supabase/migrations/0001_init.sql`로 Supabase에 옮겨야 합니다. 서버를 여러 대 띄우면 데이터가 서로 달라집니다. |
| 2 | **실질적 성인 확인** | ⚠️ 미해결 | 지금은 생년월일을 직접 입력받는 임시 방식입니다. 휴대폰 본인인증(PASS 등)이나 신분증 확인 같은 외국인도 쓸 수 있는 수단을 연동해야 합니다. |
| 3 | **법률 검토** | ⚠️ 미해결 | `/terms`, `/privacy`, `/account-deletion`, `/child-safety`는 초안입니다. 개인정보 보호책임자, 국외 이전(서버 위치), 보관 기간을 확정하세요. |
| 4 | **운영 연락처** | ⚠️ 일부 필요 | 연락 이메일은 `inbroad.global@gmail.com`이 기본값입니다. `PRIVACY_OFFICER`(개인정보 보호책임자 성명·직책)와 `OPERATOR_NAME`(상호)은 설정하지 않으면 자리표시자가 노출됩니다. |
| 5 | **HTTPS 도메인** | ⚠️ 필요 | TWA는 HTTPS 주소가 있어야 합니다(예: Render + 자체 도메인). |
| 6 | **데모 모드 끄기** | ✅ 코드 반영 | 운영 환경(`NODE_ENV=production`)에서는 기본으로 꺼집니다. `DEMO_MODE=true`로 켜지 마세요. |

---

## 1. 이번에 코드에 반영한 정책 대응

| Play 정책 | 문제가 될 수 있던 점 | 반영 내용 |
|---|---|---|
| **사기성 행위(Deceptive Behavior)** | 자동으로 좋아요·답장하는 가짜 프로필 24명이 실제 사용자처럼 보임 | `DEMO_MODE` 플래그 추가. 운영에서는 데모 프로필·자동응답·공개된 데모 계정이 모두 꺼짐 (`src/lib/config.ts`) |
| **보안 / 계정 탈취** | `admin@kcouple.dev / admin1234` 기본 관리자 계정 | 운영에서는 기본 관리자 없음. `ADMIN_EMAIL`, `ADMIN_PASSWORD`(12자 이상)로만 생성 |
| **사용자 데이터: 계정 삭제** | 앱 밖에서 삭제를 요청할 웹 링크가 없음 | `/account-deletion` 페이지 추가 (절차 안내, 로그인 시 바로 삭제, 삭제·보관 항목 명시) |
| **아동 안전 기준(CSAE)** — 데이팅·소셜 앱 필수 | 공개된 아동 안전 기준과 담당 연락처가 없음 | `/child-safety` 페이지 추가 (무관용 원칙, 신고 방법, 수사기관 신고, 담당자 연락처) |
| **사용자 제작 콘텐츠(UGC)** | 이용약관 페이지가 없음 / 신고가 채팅에서만 가능 | `/terms` 추가(금지 행위·제재 명시, 가입 시 동의), **탐색 화면 프로필에서도 신고·차단** 가능 |
| **개인정보 처리방침** | 보호책임자, 위탁·국외 이전, 이용자 권리 항목 누락 | `/privacy` 보강, 연락처는 환경변수로 표시 |
| **접근성(사전 출시 보고서)** | `maximum-scale=1`로 확대가 막힘 | 확대 허용, 노치 화면 대응(`viewport-fit=cover`) |
| **TWA 요건** | PNG 아이콘·maskable 아이콘·오프라인 처리·asset links 없음 | 192/512 PNG + maskable 아이콘, 오프라인 화면이 있는 서비스 워커(`public/sw.js`), `/.well-known/assetlinks.json` |
| **보안 헤더** | 없음 | `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `HSTS`, `Permissions-Policy` |

API 응답과 사용자 데이터는 서비스 워커가 캐시하지 않습니다.

---

## 2. 단계별 절차

### 2-1. 웹 배포 (HTTPS)

Render 기준입니다. 영구 디스크를 쓰려면 유료 인스턴스가 필요합니다.

1. Render → New → Web Service → `wooramseo1/Kcouple`
2. Build: `npm install && npm run build` · Start: `npm start`
3. Disks: Mount Path `/var/data` (1GB)
4. Environment에 `.env.example`의 값을 설정합니다.
   ```
   DATA_DIR=/var/data
   DEMO_MODE=false
   ADMIN_EMAIL=ops@내도메인
   ADMIN_PASSWORD=<12자 이상>
   SUPPORT_EMAIL=inbroad.global@gmail.com
   CHILD_SAFETY_EMAIL=inbroad.global@gmail.com
   PRIVACY_OFFICER=홍길동 (대표)
   OPERATOR_NAME=<상호>
   SITE_URL=https://내도메인
   ```
5. Settings → Custom Domain에서 자체 도메인을 연결합니다(권장).
6. 확인: `https://내도메인/terms`, `/privacy`, `/child-safety`, `/account-deletion`, `/manifest.webmanifest`가 모두 열려야 합니다.

### 2-2. Google Play 개발자 계정

1. https://play.google.com/console 에서 가입합니다. 등록비는 1회 US$25입니다.
2. **개인 계정**으로 새로 만들면 출시 전에 **테스터 12명 이상이 14일 연속 비공개 테스트**를 해야 프로덕션 출시를 신청할 수 있습니다. **조직 계정**(사업자, D-U-N-S 번호 필요)은 이 요건이 없습니다.
3. 본인 확인(신분증), 연락처 확인을 마칩니다.

### 2-3. 안드로이드 앱(.aab) 만들기 — Bubblewrap

필요한 것: Node 18+, JDK 17. Android SDK는 Bubblewrap이 설치를 안내합니다.

```bash
npm i -g @bubblewrap/cli
mkdir kcouple-android && cd kcouple-android
bubblewrap init --manifest https://내도메인/manifest.webmanifest
```

`init`이 물어보는 항목은 다음과 같이 입력합니다.

| 질문 | 값 |
|---|---|
| Application ID (패키지명) | 예: `app.kcouple.android` (**한 번 정하면 바꿀 수 없음**) |
| App name / Launcher name | K-Couple |
| Display mode | standalone |
| Orientation | portrait |
| Status bar color | `#FD4A6C` |
| Splash screen color | `#FFFFFF` |
| Icon / Maskable icon | 매니페스트에서 자동 (`/icons/icon-512.png`, `/icons/maskable-512.png`) |
| Signing key | 새로 생성합니다. **keystore 파일과 비밀번호는 잃어버리면 안 됩니다.** |

```bash
bubblewrap build          # app-release-bundle.aab, app-release-signed.apk 생성
bubblewrap fingerprint list   # 업로드 키의 SHA-256 확인
```

> PWABuilder(https://www.pwabuilder.com)에 도메인을 넣고 "Android" 패키지를 받는 방법도 결과는 같습니다.

### 2-4. Digital Asset Links 연결 (주소창 없애기)

1. Play Console → 앱 → **테스트 및 출시 → 설정 → 앱 무결성 → 앱 서명**에서 **앱 서명 키 인증서의 SHA-256**을 복사합니다. Play가 앱을 다시 서명하므로 이 값이 필요합니다.
2. 업로드 키 SHA-256(2-3단계)과 함께 서버 환경변수에 넣습니다.
   ```
   ANDROID_PACKAGE_NAME=app.kcouple.android
   ANDROID_SHA256_CERT_FINGERPRINTS=<Play 앱 서명 키>,<업로드 키>
   ```
3. 재배포 후 `https://내도메인/.well-known/assetlinks.json`에 두 지문이 보이는지 확인합니다.
4. 설치한 앱 상단에 주소창이 보이면 이 단계가 잘못된 것입니다.

### 2-5. Play Console 앱 등록

**앱 만들기**: 기본 언어 한국어, 앱(게임 아님), 무료.

**앱 콘텐츠(정책 선언)** — 대부분 아래처럼 답하면 됩니다.

| 항목 | 입력 |
|---|---|
| 개인정보처리방침 | `https://내도메인/privacy` |
| 앱 액세스 권한 | "일부 기능이 제한됨" → 심사용 **테스트 계정**(이메일/비밀번호)과 안내 입력. 심사자가 매칭을 볼 수 있도록 심사 전에 서로 매칭된 테스트 계정 2개를 준비하세요. |
| 광고 | 광고 없음 |
| 콘텐츠 등급(IARC 설문) | 카테고리: 소셜/커뮤니케이션 성격. "사용자 간 상호작용 있음", "사용자가 만든 콘텐츠 공유", "위치 공유 없음", "디지털 구매 없음". 데이팅 앱은 보통 **성인/청소년이용불가** 등급이 나옵니다. |
| 타겟층 | **18세 이상만** 선택. 아동 대상 아님. |
| 데이터 보안(Data safety) | 아래 표 |
| 계정 삭제 | 앱 내 삭제 있음 + 웹 URL `https://내도메인/account-deletion` |
| 아동 안전 기준 | 기준 URL `https://내도메인/child-safety`, 담당자 연락처, 앱 내 신고 기능 있음, CSAM 법령 준수 확인 |
| 정부 앱 / 금융 / 건강 | 해당 없음 |

**데이터 보안 양식 답변**

| 데이터 유형 | 수집 | 공유 | 목적 | 필수 여부 |
|---|---|---|---|---|
| 이메일 주소 | 예 | 아니요 | 계정 관리 | 필수 |
| 이름(닉네임) | 예 | 아니요 | 앱 기능 | 필수 |
| 생년월일(기타 개인 정보) | 예 | 아니요 | 계정 관리(연령 확인) | 필수 |
| 성별 | 예 | 아니요 | 앱 기능 | 필수 |
| 성적 지향(선호 성별) | 예 | 아니요 | 앱 기능 | 필수 |
| 국적(기타 개인 정보) | 예 | 아니요 | 앱 기능 | 필수 |
| 대략적인 위치(거주 도시, 직접 선택) | 예 | 아니요 | 앱 기능 | 필수 |
| 사진 | 예 | 아니요 | 앱 기능 | 필수 |
| 메시지(앱 내 메시지) | 예 | 아니요 | 앱 기능 | 필수 |
| 기타 사용자 생성 콘텐츠(소개, 관심사) | 예 | 아니요 | 앱 기능 | 선택 |
| 앱 활동(좋아요/패스) | 예 | 아니요 | 앱 기능, 맞춤 추천 | 필수 |

- 전송 중 암호화: **예**(HTTPS)
- 삭제 요청 가능: **예**
- 정밀 위치, 연락처, 기기 ID, 광고 ID: **수집 안 함**

> "다른 이용자에게 표시되는 프로필"은 Google 정의상 "공유"가 아닙니다(사용자가 직접 공개를 선택한 경우). 다만 외부 서비스(분석, 이미지 검수 API 등)를 붙이면 그때 "공유"로 바꿔야 합니다.

**스토어 등록정보**

| 항목 | 파일 / 내용 |
|---|---|
| 앱 아이콘 512×512 | `docs/play-store/app-icon-512.png` |
| 그래픽 이미지 1024×500 | `docs/play-store/feature-graphic-1024x500.png` |
| 휴대전화 스크린샷(최소 2장, 1080×1920) | `docs/play-store/screenshot-*.png` (데모 데이터 화면입니다. 실제 사진이 있는 화면으로 교체를 권장합니다.) |
| 카테고리 | 데이트 |
| 짧은 설명(80자) | 한국에서 만나는 국제 연애 — 서로 좋아요를 눌러야 대화가 열리는 안전한 매칭 |
| 연락처 이메일 | `SUPPORT_EMAIL`과 동일하게 |

> 스토어 문구에 "결혼", "100% 매칭 보장", 특정 국적·성별을 대상화하는 표현을 쓰지 마세요. 결혼중개업법과 Play 부적절한 콘텐츠 정책에 걸릴 수 있습니다.

### 2-6. 테스트 → 출시

1. **비공개 테스트** 트랙에 `.aab`를 업로드하고 테스터 이메일을 추가합니다. 개인 계정이면 12명 이상, 14일 연속 참여가 필요합니다.
2. **사전 출시 보고서**에서 크래시, 접근성, 보안 경고를 확인합니다.
3. **프로덕션** 트랙 → 국가: 대한민국(필요시 추가) → 검토 제출. 심사는 보통 수일, 신규 계정은 최대 몇 주 걸립니다.

---

## 3. 한국 출시 시 추가 확인 사항

- **청소년이용불가 등급과 성인 인증**: 한국 Play 스토어에서 성인 등급 앱은 Google 계정의 성인 인증을 요구할 수 있습니다. 그와 별개로 앱 안에서도 실질적인 연령 확인이 필요합니다(0-2).
- **개인정보 보호법**: 처리방침에 보호책임자, 위탁, 국외 이전(해외 서버라면 국가·업체·항목·보관 기간)을 반드시 기재해야 합니다.
- **정보통신망법**: 청소년 유해매체물로 판단되면 표시 의무가 있습니다. 법률 검토 시 확인하세요.
- **결혼중개업법**: 유료로 만남을 주선하거나 결혼을 홍보하면 결혼중개업 등록 대상이 될 수 있습니다. 지금 구조(무료, 자율 매칭)를 유지하세요.
- **통신판매업 신고**: 나중에 구독(유료 기능)을 도입하면 필요합니다. 그때는 Play 결제 시스템도 써야 합니다.

---

## 4. 업데이트 방법

- **화면·기능 변경**: 웹만 다시 배포하면 됩니다. 앱 재심사가 필요 없습니다.
- **아이콘·앱 이름·패키지 설정 변경**: `twa-manifest.json` 수정 → `bubblewrap update` → `bubblewrap build` → `versionCode`를 올려서 새 `.aab`를 업로드합니다.
- **아이콘 다시 만들기**: `node scripts/generate-icons.mjs`
