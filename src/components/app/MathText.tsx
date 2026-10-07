import React from "react";

export interface MathTextProps {
  text: string;
  className?: string;
  block?: boolean;
}

export function MathText({ text, className = "", block = false }: MathTextProps) {
  // 평문 및 기본 수식 강조 렌더러
  // 향후 KaTeX 연결 시 이 모듈에서 지연 로딩 가능하도록 경계 격리
  if (block) {
    return (
      <div
        className={`my-2 overflow-x-auto rounded-lg bg-muted/50 p-3 font-mono text-base font-medium text-foreground ${className}`}
      >
        {text}
      </div>
    );
  }

  return (
    <span className={`font-mono text-base font-medium text-foreground ${className}`}>{text}</span>
  );
}
