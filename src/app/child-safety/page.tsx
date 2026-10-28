import type { Metadata } from "next";
import { getLang } from "@/i18n/server";
import { site } from "@/lib/config";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Child Safety Standards — K-Couple" };

/** Published child-safety standards, required by Google Play for dating and social apps. */
export default async function ChildSafetyPage() {
  const ko = (await getLang()) === "ko";
  const sections: LegalSection[] = ko ? [
    ["원칙", "K-Couple은 아동 성착취 및 학대(CSAE)와 아동 성착취물(CSAM)을 절대 허용하지 않습니다. K-Couple은 만 19세 이상 성인 전용 서비스입니다."],
    ["예방 조치", [
      "가입 시 성인 확인을 거치며, 만 19세 미만으로 확인되면 가입이 거절됩니다.",
      "모든 프로필과 채팅에 ‘미성년자 의심’ 신고 사유가 있으며 이 신고는 최우선으로 검토됩니다.",
      "채팅은 서로 좋아요를 누른 성인 이용자 사이에서만 가능하고, 외부 링크 전송을 차단합니다.",
      "프로필 사진은 신고 및 운영자 검토 대상입니다.",
    ]],
    ["위반 시 조치", "미성년자로 의심되는 계정이나 아동을 성적으로 대상화하는 콘텐츠가 확인되면 즉시 계정을 정지하고 콘텐츠를 삭제하며, 관련 법령에 따라 수사기관 및 관계 기관(예: 경찰청, 방송통신심의위원회, NCMEC 등)에 신고합니다."],
    ["신고 방법", "앱에서 상대 프로필 또는 채팅의 메뉴 > 신고하기 > ‘미성년자 의심’을 선택하거나, 아래 아동 안전 담당자에게 이메일로 알려주세요."],
    ["아동 안전 담당자", site.childSafetyEmail],
  ] : [
    ["Our standard", "K-Couple has zero tolerance for child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM). K-Couple is for adults aged 19 and over only."],
    ["Prevention", [
      "Every user passes an adult check at sign-up; anyone under 19 is refused.",
      "Every profile and chat has a “May be under 19” report reason, reviewed with top priority.",
      "Chat is only possible between adults who both liked each other, and outside links are blocked.",
      "Profile photos are subject to reporting and moderator review.",
    ]],
    ["Enforcement", "Accounts suspected to belong to minors, or content that sexualises children, are suspended and removed immediately and reported to law enforcement and relevant authorities (e.g. Korean National Police Agency, KCSC, NCMEC) as required by law."],
    ["How to report", "In the app, open the person's profile or chat menu > Report > “May be under 19”, or email our child-safety contact below."],
    ["Child-safety point of contact", site.childSafetyEmail],
  ];
  return <LegalPage title={ko ? "아동 안전 기준" : "Child Safety Standards"} updated={ko ? "최종 업데이트: 정식 출시일" : "Last updated: public launch date"} sections={sections} />;
}
