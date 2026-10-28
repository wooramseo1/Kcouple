import type { Metadata } from "next";
import { getLang } from "@/i18n/server";
import { site } from "@/lib/config";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy Policy — K-Couple" };

export default async function PrivacyPage() {
  const ko = (await getLang()) === "ko";
  const sections: LegalSection[] = ko ? [
    ["1. 수집 항목", [
      "필수: 이메일, 비밀번호(암호화 저장), 생년월일(성인 확인용·비공개), 닉네임, 성별, 이용자 그룹(한국인/외국인), 국적, 거주 도시, 사용 언어, 관계 목적, 관심사, 프로필 사진",
      "선택: 자기소개",
      "서비스 이용 중 생성: 좋아요/패스, 매칭, 메시지, 신고·차단 기록, 접속 일시",
    ]],
    ["2. 수집하지 않는 항목", "집 주소, 외국인등록번호·여권번호, 비자·직장 증빙, GPS 위치정보, 연락처, 광고 식별자."],
    ["3. 이용 목적", "회원 식별, 성인 확인, 상호 선호 기반 추천, 매칭된 이용자 간 채팅, 신고 처리와 부정 이용 방지. 광고 타깃팅이나 제3자 판매에 사용하지 않습니다."],
    ["4. 공개 범위", "다른 이용자에게는 닉네임, 나이, 국적, 도시, 언어, 관계 목적, 소개, 관심사, 사진만 표시됩니다. 이메일과 생년월일은 공개되지 않습니다."],
    ["5. 보관 및 파기", "탈퇴 즉시 프로필, 사진, 좋아요, 메시지를 삭제합니다. 신고·제재·감사 기록은 분쟁 대응을 위해 관련 법령에 따른 기간 동안 분리 보관 후 파기합니다. 자세한 절차는 /account-deletion 을 참고하세요."],
    ["6. 처리 위탁 및 국외 이전", "서비스 운영을 위해 클라우드 호스팅·데이터베이스 사업자에게 데이터 보관을 위탁할 수 있으며, 서버가 국외에 있는 경우 이전 국가, 업체명, 항목을 이 방침에 기재합니다. (정식 출시 전 확정)"],
    ["7. 안전성 확보 조치", "전송 구간 암호화(HTTPS), 비밀번호 단방향 암호화, 접근 권한 최소화, 운영자 접근 기록(감사 로그) 보관."],
    ["8. 이용자의 권리", "언제든 프로필을 열람·수정하거나, 공개를 중단하거나, 탈퇴할 수 있습니다. 그 밖의 열람·정정·삭제·처리정지 요청은 아래 연락처로 할 수 있습니다."],
    ["9. AI 학습", "채팅 내용은 이용자 동의 없이 AI 학습에 사용하지 않습니다."],
    ["10. 개인정보 보호책임자", `${site.privacyOfficer}\n이메일: ${site.supportEmail}`],
  ] : [
    ["1. What we collect", [
      "Required: email, password (stored hashed), birth date (for the adult check, never shown), nickname, gender, user group (Korean/foreigner), nationality, city, languages, relationship goal, interests, profile photos",
      "Optional: bio",
      "Created while you use the service: likes/passes, matches, messages, report and block records, last-active time",
    ]],
    ["2. What we don't collect", "Home address, ARC/passport numbers, visa or employment documents, GPS location, contacts, advertising ID."],
    ["3. Why", "Account identification, adult verification, mutual-preference recommendations, chat between matched users, report handling and abuse prevention. Never used for ad targeting or sold to third parties."],
    ["4. What others see", "Other users only see your nickname, age, nationality, city, languages, goal, bio, interests and photos. Your email and birth date are never shown."],
    ["5. Retention & deletion", "Deleting your account immediately removes your profile, photos, likes and messages. Report, enforcement and audit records are kept separately for the period required by law, then destroyed. See /account-deletion."],
    ["6. Processors & transfers", "We may use cloud hosting and database providers to store data. If servers are outside Korea, the country, provider and data items will be listed here. (To be finalised before launch.)"],
    ["7. Security", "Encryption in transit (HTTPS), one-way password hashing, least-privilege access, and audit logs of operator access."],
    ["8. Your rights", "You can view and edit your profile, hide it, or delete your account at any time. For other access, correction, deletion or restriction requests, contact us below."],
    ["9. AI training", "Chat messages are never used for AI training without your consent."],
    ["10. Privacy officer", `${site.privacyOfficer}\nEmail: ${site.supportEmail}`],
  ];
  return <LegalPage title={ko ? "개인정보 처리방침" : "Privacy Policy"} updated={ko ? "시행일: 정식 출시일" : "Effective: public launch date"}
    note={ko ? "베타 초안 — 정식 출시 전 법률 검토 후 확정됩니다." : "Beta draft — to be finalised after legal review before launch."} sections={sections} />;
}
