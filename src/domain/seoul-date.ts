/**
 * 한국(Asia/Seoul) 표준시 날짜 계산 및 변환 유틸리티
 * domain/seoul-date.ts
 */

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

export function getSeoulNow(customClock?: Date): Date {
  return customClock ?? new Date();
}

/**
 * Asia/Seoul 기준 오늘의 'YYYY-MM-DD' 문자열 반환
 */
export function getSeoulTodayString(customClock?: Date): string {
  const d = customClock ?? new Date();
  const seoulTime = new Date(d.getTime() + SEOUL_OFFSET_MS);
  const year = seoulTime.getUTCFullYear();
  const month = String(seoulTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(seoulTime.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * UTC Date 또는 ISO 문자열을 Asia/Seoul 기준 'YYYY.MM.DD HH:mm' 포맷 문자열로 변환
 */
export function formatSeoulDateTime(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const seoulTime = new Date(d.getTime() + SEOUL_OFFSET_MS);
  const year = seoulTime.getUTCFullYear();
  const month = String(seoulTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(seoulTime.getUTCDate()).padStart(2, "0");
  const hours = String(seoulTime.getUTCHours()).padStart(2, "0");
  const minutes = String(seoulTime.getUTCMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * UTC Date 또는 ISO 문자열을 Asia/Seoul 기준 'YYYY.MM.DD' 포맷 문자열로 변환
 */
export function formatSeoulDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "—";

  const seoulTime = new Date(d.getTime() + SEOUL_OFFSET_MS);
  const year = seoulTime.getUTCFullYear();
  const month = String(seoulTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(seoulTime.getUTCDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

/**
 * 서울 날짜 기준 YYYY-MM-DD 범위 검증 (시작일 <= 종료일, 최대 90일)
 */
export function validateDateRange(
  fromDateStr: string,
  toDateStr: string,
  maxDays = 90,
): { valid: boolean; message?: string } {
  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return { valid: false, message: "올바른 날짜 형식이 아닙니다." };
  }

  if (from.getTime() > to.getTime()) {
    return { valid: false, message: "조회 시작일은 종료일보다 이전이어야 합니다." };
  }

  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (diffDays > maxDays) {
    return { valid: false, message: `조회 기간은 최대 ${maxDays}일까지 설정할 수 있습니다.` };
  }

  return { valid: true };
}

/**
 * 서울 날짜 기준 특정 일이 조회 범위 내에 있는지 확인
 */
export function isWithinSeoulRange(
  targetDateInput: string | Date | number,
  fromDateStr: string,
  toDateStr: string,
): boolean {
  const target = new Date(targetDateInput);
  if (isNaN(target.getTime())) return false;

  // from 00:00:00 KST
  const fromKst = new Date(`${fromDateStr}T00:00:00+09:00`);
  // to 23:59:59.999 KST
  const toKst = new Date(`${toDateStr}T23:59:59.999+09:00`);

  const t = target.getTime();
  return t >= fromKst.getTime() && t <= toKst.getTime();
}
