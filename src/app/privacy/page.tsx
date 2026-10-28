import Link from "next/link";
import { getLang } from "@/i18n/server";
import { Logo } from "@/components/Logo";

const CONTENT = {
  ko: {
    title: "개인정보 처리방침 (베타 초안)",
    note: "본 문서는 베타용 초안이며 정식 출시 전 법률 검토를 거쳐 확정됩니다.",
    sections: [
      ["수집 항목", "이메일, 비밀번호(해시), 생년월일(성인 확인용·비공개), 닉네임, 성별, 국적, 거주 도시, 사용 언어, 관계 목적, 자기소개, 관심사, 프로필 사진, 매칭·메시지 기록, 신고·차단 기록."],
      ["수집하지 않는 항목", "집 주소, 외국인등록번호, 비자·직장 증빙, GPS 위치정보."],
      ["이용 목적", "회원 식별, 성인 확인, 상호 선호 기반 추천, 매칭된 이용자 간 채팅, 신고 처리 및 서비스 안전 운영."],
      ["공개 범위", "다른 이용자에게는 닉네임, 나이, 국적, 도시, 언어, 관계 목적, 소개, 관심사, 사진만 표시됩니다. 이메일과 생년월일은 공개되지 않습니다."],
      ["보관 및 삭제", "회원 탈퇴 시 프로필, 사진, 좋아요, 메시지는 삭제됩니다. 신고·감사 기록은 분쟁 대응을 위해 법령이 정한 기간 동안 분리 보관될 수 있습니다."],
      ["AI 학습", "채팅 원문은 이용자 동의 없이 AI 학습에 사용하지 않습니다."],
    ],
  },
  en: {
    title: "Privacy Policy (beta draft)",
    note: "This is a beta draft and will be finalized after legal review before public launch.",
    sections: [
      ["What we collect", "Email, password (hashed), birth date (for the adult check, private), nickname, gender, nationality, city, languages, relationship goal, bio, interests, profile photos, match and message records, report and block records."],
      ["What we don't collect", "Home address, Alien Registration Number, visa or employment documents, GPS location."],
      ["Why", "Account identification, adult verification, mutual-preference recommendations, chat between matched users, report handling and keeping the service safe."],
      ["What others see", "Other users only see your nickname, age, nationality, city, languages, goal, bio, interests and photos. Your email and birth date are never shown."],
      ["Retention & deletion", "Deleting your account removes your profile, photos, likes and messages. Report and audit records may be kept separately for the period required by law."],
      ["AI training", "Chat messages are never used for AI training without your consent."],
    ],
  },
};

export default async function PrivacyPage() {
  const c = CONTENT[await getLang()];
  return (
    <main className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/"><Logo className="text-xl" /></Link>
      <h1 className="mt-8 text-3xl font-extrabold">{c.title}</h1>
      <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{c.note}</p>
      <div className="mt-6 space-y-5">
        {c.sections.map(([h, b]) => (
          <section key={h}><h2 className="font-bold">{h}</h2><p className="mt-1 leading-relaxed text-ink-700">{b}</p></section>
        ))}
      </div>
    </main>
  );
}
