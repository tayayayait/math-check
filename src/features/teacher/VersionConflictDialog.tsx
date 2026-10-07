import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";

interface VersionConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onReloadAndReapply: () => void;
  latestVersion: number;
}

export function VersionConflictDialog({
  isOpen,
  onClose,
  onReloadAndReapply,
  latestVersion,
}: VersionConflictDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>⚠️</span> 동시 검수 버전 충돌 안내
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
            작성하시는 동안 다른 선생님이나 시스템에 의해 진단 결과 버전이 갱신되었습니다. (최신
            버전: <strong>v{latestVersion}</strong>)
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 text-xs text-slate-700 space-y-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
          <p className="font-semibold text-amber-900">작성하신 내용은 임시 보존되어 있습니다.</p>
          <p>
            다른 선생님의 검수 내역을 덮어쓰지 않도록 최신 데이터를 다시 불러온 후, 선생님께서
            작성하신 수정 내용을 다시 검토하고 저장해 주세요.
          </p>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} className="text-xs h-9 px-3">
            취소 및 닫기
          </Button>
          <Button
            type="button"
            onClick={onReloadAndReapply}
            className="text-xs h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            최신 데이터 불러오기 및 재검토
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
