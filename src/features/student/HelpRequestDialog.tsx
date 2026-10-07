import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

interface HelpRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
}

export function HelpRequestDialog({ isOpen, onClose, onSubmit }: HelpRequestDialogProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (message.length > 300) {
      setError("질문 내용은 최대 300자까지 작성할 수 있습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(message.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "질문 전송 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🙋‍♂️</span> 선생님께 질문하기
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
            풀이 과정 중 이해하기 어렵거나 막히는 부분을 질문해 보세요. 담당 선생님께서 확인 후
            지도를 도와주십니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-xs text-red-700 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="help-message" className="block text-xs font-semibold text-slate-700">
              질문 또는 요청 내용{" "}
              <span className="font-normal text-slate-400">(선택 사항, 최대 300자)</span>
            </label>
            <textarea
              id="help-message"
              rows={4}
              maxLength={300}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="예: 2번째 줄에서 이항할 때 부호가 왜 바뀌어야 하는지 헷갈려요."
              className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none resize-none"
            />
            <div className="text-right text-[11px] text-slate-400">{message.length} / 300자</div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">📌 안내 사항</p>
            <p>
              • 질문을 보내면 진단 상태가{" "}
              <strong className="text-amber-700">선생님 확인 대기</strong>로 전환됩니다.
            </p>
            <p>• 선생님 확인 전까지는 새로운 힌트 열람 및 재풀이가 일시 중단됩니다.</p>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
            className="text-xs h-10 px-4"
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="text-xs h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl"
          >
            {isSubmitting ? "전송 중..." : "질문 접수하기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
