"use client";

import { SignIn } from "@clerk/nextjs";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;

  return (
    <div className="mx-auto flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold">로그인</h1>
        <p className="text-slate-500">
          구글 계정으로 간편하게 로그인하세요
        </p>
      </header>
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-sm",
          },
        }}
        routing="path"
        path="/login"
        signUpUrl="/signup"
        forceRedirectUrl="/"
      />
    </div>
  );
}
