import { ProfileEditForm } from "./ProfileEditForm";

export default function ProfileEditPage() {
  return (
    <div className="w-full flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">회원정보 수정</h1>
      <div className="w-full flex justify-center">
        <ProfileEditForm />
      </div>
    </div>
  );
}
