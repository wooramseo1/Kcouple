import type { Metadata } from "next";
import { getLang } from "@/i18n/server";
import { site } from "@/lib/config";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Service — K-Couple" };

export default async function TermsPage() {
  const ko = (await getLang()) === "ko";
  const sections: LegalSection[] = ko ? [
    ["1. 서비스", "K-Couple은 한국에 거주·체류하는 외국인과 한국인 성인이 서로 동의한 경우에만 대화할 수 있도록 연결하는 데이팅 플랫폼입니다. 결혼중개 서비스가 아니며 만남이나 관계의 결과를 보장하지 않습니다."],
    ["2. 이용 자격", ["만 19세 이상만 가입할 수 있습니다.", "본인 명의의 계정 1개만 사용할 수 있으며 타인을 사칭할 수 없습니다.", "과거 이용 제한을 받은 경우 다시 가입할 수 없습니다."]],
    ["3. 금지 행위 (무관용 원칙)", [
      "미성년자를 대상으로 하거나 미성년자를 성적으로 묘사하는 모든 콘텐츠·행위 — 즉시 영구 정지 및 관계 기관 신고",
      "음란물, 노출 사진, 성적 대화 강요, 성희롱",
      "괴롭힘, 위협, 혐오 표현, 국적·인종·성별에 대한 차별",
      "송금 요구, 투자 권유, 로맨스 스캠 등 금전 사기",
      "성매매·조건만남 및 이를 암시하는 모든 행위",
      "스팸, 광고, 외부 링크 유도, 허위 프로필·도용 사진",
    ]],
    ["4. 신고와 제재", "모든 프로필과 채팅에서 신고·차단할 수 있습니다. 운영팀은 신고를 심각도 순으로 검토하며 경고, 일시 정지, 영구 정지 등의 조치를 할 수 있습니다. 조치에 이의가 있으면 아래 연락처로 이의를 제기할 수 있습니다."],
    ["5. 콘텐츠", "이용자가 올린 사진과 글의 책임은 이용자에게 있습니다. 서비스 운영을 위해 필요한 범위에서만 이를 표시·저장하며, 정책 위반 콘텐츠는 사전 통지 없이 삭제할 수 있습니다."],
    ["6. 안전 수칙", ["상대에게 절대 돈을 보내지 마세요.", "첫 만남은 공공장소에서, 지인에게 일정을 알리세요.", "불편한 상대는 즉시 차단·신고하세요."]],
    ["7. 탈퇴", "앱의 설정 > 회원 탈퇴 또는 /account-deletion 페이지에서 언제든 탈퇴할 수 있습니다."],
    ["8. 문의", `${site.supportEmail}`],
  ] : [
    ["1. The service", "K-Couple is a dating platform that connects foreigners living in or visiting Korea with Korean adults, and only lets people chat when both sides agree. It is not a marriage brokerage and does not guarantee any outcome."],
    ["2. Eligibility", ["You must be 19 or older.", "One personal account per person; no impersonation.", "You may not re-register after being banned."]],
    ["3. Prohibited conduct (zero tolerance)", [
      "Any content or conduct that targets or sexualises minors — immediate permanent ban and report to authorities",
      "Pornography, nude images, pressuring others into sexual conversation, sexual harassment",
      "Harassment, threats, hate speech, discrimination based on nationality, race or gender",
      "Requests for money, investment pitches, romance scams",
      "Prostitution or anything implying paid sexual services",
      "Spam, advertising, pushing users to outside links, fake profiles or stolen photos",
    ]],
    ["4. Reporting and enforcement", "You can report or block anyone from their profile or chat. Our team reviews reports by severity and may warn, suspend or permanently ban accounts. You can appeal a decision via the contact below."],
    ["5. Your content", "You are responsible for the photos and text you post. We display and store them only as needed to run the service, and may remove content that breaks these rules without notice."],
    ["6. Staying safe", ["Never send money to someone you met here.", "Meet in public for the first time and tell a friend your plans.", "Block and report anyone who makes you uncomfortable."]],
    ["7. Leaving", "You can delete your account any time in Settings > Delete account, or at /account-deletion."],
    ["8. Contact", `${site.supportEmail}`],
  ];
  return <LegalPage title={ko ? "서비스 이용약관" : "Terms of Service"} updated={ko ? "시행일: 정식 출시일" : "Effective: public launch date"}
    note={ko ? "베타 초안 — 정식 출시 전 법률 검토 후 확정됩니다." : "Beta draft — to be finalised after legal review before launch."} sections={sections} />;
}
