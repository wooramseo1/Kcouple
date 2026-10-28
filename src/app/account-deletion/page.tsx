import type { Metadata } from "next";
import Link from "next/link";
import { getLang } from "@/i18n/server";
import { currentUser } from "@/lib/auth";
import { site } from "@/lib/config";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { DeleteAccountButton } from "./DeleteAccountButton";

export const metadata: Metadata = { title: "Delete your account — K-Couple" };

/** Web page for account deletion, required by Google Play's User Data policy. */
export default async function AccountDeletionPage() {
  const ko = (await getLang()) === "ko";
  const user = await currentUser();
  const sections: LegalSection[] = ko ? [
    ["앱에서 삭제하기", ["K-Couple 앱 또는 웹에 로그인합니다.", "MY > 설정 > 회원 탈퇴를 누릅니다.", "확인하면 즉시 삭제됩니다."]],
    ["로그인할 수 없는 경우", `가입한 이메일 주소에서 ${site.supportEmail} 로 ‘계정 삭제 요청’ 메일을 보내주세요. 본인 확인 후 7일 이내에 삭제합니다.`],
    ["삭제되는 데이터", ["프로필(닉네임, 생년월일, 국적, 도시, 언어, 소개, 관심사)", "프로필 사진", "좋아요/패스 기록, 보낸 메시지", "선호 조건, 로그인 세션", "이메일 주소(복구 불가능한 값으로 대체)"]],
    ["보관되는 데이터", "신고·제재 기록과 운영 감사 로그는 분쟁 대응과 이용자 보호를 위해 관련 법령이 정한 기간(최대 1년) 동안 분리 보관 후 파기합니다."],
  ] : [
    ["Delete in the app", ["Log in to the K-Couple app or website.", "Go to Me > Settings > Delete account.", "Confirm — deletion happens immediately."]],
    ["Can't log in?", `Email ${site.supportEmail} from the address you signed up with, with the subject “Account deletion request”. We delete the account within 7 days after verifying it is yours.`],
    ["What is deleted", ["Profile (nickname, birth date, nationality, city, languages, bio, interests)", "Profile photos", "Likes/passes and messages you sent", "Preferences and login sessions", "Your email address (replaced with an unrecoverable value)"]],
    ["What is kept", "Report, enforcement and audit records are kept separately for the period required by law (up to 1 year) to handle disputes and protect users, then destroyed."],
  ];
  return (
    <LegalPage title={ko ? "K-Couple 계정 삭제" : "Delete your K-Couple account"} updated={site.operator} sections={sections}>
      <div className="card mt-6 p-4">
        {user ? (
          <DeleteAccountButton email={user.email} ko={ko} />
        ) : (
          <p className="text-sm text-ink-700">
            {ko ? "로그인하면 이 페이지에서 바로 삭제할 수 있어요. " : "Log in to delete your account right here. "}
            <Link href="/login" className="font-semibold text-brand-600 underline">{ko ? "로그인" : "Log in"}</Link>
          </p>
        )}
      </div>
    </LegalPage>
  );
}
