import React from "react";
import { Hammer } from "lucide-react";

export interface SkeletonPageProps {
  title: string;
  phase: string;
  description?: string;
}

export function SkeletonPage({ title, phase, description }: SkeletonPageProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
        <Hammer className="h-6 w-6" />
      </div>
      <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-secondary mb-2">
        {phase} 구현 예정
      </span>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-secondary max-w-sm">
        {description || "다음 개발 단계에서 구현될 화면 도안입니다."}
      </p>
    </div>
  );
}
