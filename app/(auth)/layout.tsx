import Image from "next/image";
import { Preview } from "@/components/chat/preview";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-screen bg-sidebar">
      <div className="flex w-full flex-col bg-background p-8 xl:w-[540px] xl:shrink-0 xl:rounded-r-2xl xl:border-r xl:border-border/40 md:p-16">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="flex flex-col gap-4">
            <div className="mb-2 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="mAI Logo"
                width={42}
                height={42}
                className="rounded-xl shadow-md"
                priority
              />
              <span className="font-bold text-xl tracking-tight text-foreground">mAI Web</span>
            </div>
            {children}
          </div>
        </div>
      </div>

      <div className="hidden flex-1 flex-col overflow-hidden pl-12 xl:flex bg-sidebar/50">
        <div className="flex items-center gap-2 pt-8 text-[13px] text-muted-foreground">
          <Image src="/logo.png" alt="mAI" width={18} height={18} className="rounded-sm" />
          <span className="font-semibold text-foreground">mAI Plateforme</span>
          <span>• Intelligence Artificielle & APIs</span>
        </div>
        <div className="flex-1 pt-4">
          <Preview />
        </div>
      </div>
    </div>
  );
}
