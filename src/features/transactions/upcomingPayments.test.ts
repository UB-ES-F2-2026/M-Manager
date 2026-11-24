import { describe, expect, it } from "vitest";
import {
  getUpcomingRange,
  HOME_UPCOMING_LIMIT,
  selectHomeUpcomingPayments,
  UPCOMING_DAYS,
  upcomingDateToLocal,
} from "./upcomingPayments";

describe("getUpcomingRange", () => {
  it("covers today up to today + 30 as UTC midnights of the local days", () => {
    // Local time, so the test does not depend on the machine's time zone.
    const now = new Date(2026, 10, 23, 18, 45).getTime();
    expect(UPCOMING_DAYS).toBe(30);
    expect(getUpcomingRange(now)).toEqual({
      rangeStart: Date.UTC(2026, 10, 23),
      rangeEnd: Date.UTC(2026, 11, 23),
    });
  });

  it("uses the local day even just after midnight", () => {
    const now = new Date(2026, 10, 24, 0, 5).getTime();
    expect(getUpcomingRange(now).rangeStart).toBe(Date.UTC(2026, 10, 24));
  });

  it("crosses the end of the year", () => {
    const now = new Date(2026, 11, 20, 12).getTime();
    expect(getUpcomingRange(now)).toEqual({
      rangeStart: Date.UTC(2026, 11, 20),
      rangeEnd: Date.UTC(2027, 0, 19),
    });
  });
});

describe("upcomingDateToLocal", () => {
  it("keeps the same civil day in local time", () => {
    const local = new Date(upcomingDateToLocal(Date.UTC(2026, 11, 5)));
    expect([local.getFullYear(), local.getMonth(), local.getDate()]).toEqual([2026, 11, 5]);
    expect([local.getHours(), local.getMinutes()]).toEqual([0, 0]);
  });

  it("round-trips with the range start", () => {
    const now = new Date(2026, 10, 23, 9).getTime();
    const { rangeStart } = getUpcomingRange(now);
    expect(upcomingDateToLocal(rangeStart)).toBe(new Date(2026, 10, 23).getTime());
  });
});

describe("selectHomeUpcomingPayments", () => {
  it("keeps only the 5 nearest payments, in the query order", () => {
    const payments = [1, 2, 3, 4, 5, 6, 7];
    expect(HOME_UPCOMING_LIMIT).toBe(5);
    expect(selectHomeUpcomingPayments(payments)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns every payment when there are fewer than 5", () => {
    expect(selectHomeUpcomingPayments([])).toEqual([]);
    expect(selectHomeUpcomingPayments([1, 2])).toEqual([1, 2]);
  });
});
