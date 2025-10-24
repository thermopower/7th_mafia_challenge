"use client";

import { SignUp } from "@clerk/nextjs";

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">회원가입</h1>
        <p className="text-slate-500">
          구글 계정으로 간편하게 시작하세요
        </p>
      </header>
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-sm",
          },
        }}
        routing="path"
        path="/signup"
        signInUrl="/login"
        forceRedirectUrl="/"
      />
    </div>
  );
}
