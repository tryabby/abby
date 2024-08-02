import { assertUnreachable } from "@tryabby/core";
import dayjs from "dayjs";

export enum SpecialTimeInterval {
  DAY = "day",
  Last30DAYS = "30d",
  ALL_TIME = "all",
}

export const INTERVALS = [
  {
    label: "Today",
    value: SpecialTimeInterval.DAY,
  },
  {
    label: "Last 30 days",
    value: SpecialTimeInterval.Last30DAYS,
  },
  {
    label: "All Time",
    value: SpecialTimeInterval.ALL_TIME,
  },
] as const;

type INTERVAL = (typeof INTERVALS)[number]["value"];

export function isValidInterval(interval: string): interval is INTERVAL {
  return INTERVALS.map((i) => i.value).includes(interval as INTERVAL);
}

export function isSpecialTimeInterval(
  timeInterval: string
): timeInterval is SpecialTimeInterval {
  return Object.values(SpecialTimeInterval).includes(
    timeInterval as SpecialTimeInterval
  );
}

export function getMSFromSpecialTimeInterval(
  timeInterval: SpecialTimeInterval
): number {
  switch (timeInterval) {
    case SpecialTimeInterval.DAY: {
      return 1000 * 60 * 60 * 24;
    }
    case SpecialTimeInterval.Last30DAYS: {
      return 1000 * 60 * 60 * 24 * 30;
    }
    case SpecialTimeInterval.ALL_TIME: {
      return Infinity;
    }
    default:
      assertUnreachable(timeInterval);
  }
}

export function getFormattingByInterval(interval: INTERVAL) {
  switch (interval) {
    case SpecialTimeInterval.DAY: {
      return "HH:mm";
    }
    case "30d": {
      return "DD MMM";
    }
    case SpecialTimeInterval.ALL_TIME: {
      return "MMM YY";
    }
  }
}

export function getLabelsByInterval(
  interval: (typeof INTERVALS)[number]["value"],
  fistEventDate: Date
): { labels: Array<string>; dates: Array<Date> } {
  const formatting = getFormattingByInterval(interval);
  switch (interval) {
    case SpecialTimeInterval.DAY: {
      const baseData = dayjs().set("minute", 0);
      const dateArray = [0, 3, 6, 9, 12, 15, 18, 21].map((hour) =>
        baseData.set("hour", hour)
      );
      return {
        labels: dateArray.map((date) => date.format(formatting)),
        dates: dateArray.map((date) => date.toDate()),
      };
    }

    case SpecialTimeInterval.Last30DAYS: {
      const dateArray = Array.from({ length: 30 }, (_, i) =>
        dayjs().subtract(i, "day")
      ).reverse();
      return {
        labels: dateArray.map((date) => date.format(formatting)),
        dates: dateArray.map((date) => date.set("minute", 0).toDate()),
      };
    }
    case SpecialTimeInterval.ALL_TIME: {
      const diff = dayjs().diff(dayjs(fistEventDate), "month");

      const dateArray = Array.from({ length: Math.max(diff, 6) }, (_, i) =>
        dayjs(fistEventDate).add(i, "month")
      ).reverse();
      return {
        labels: dateArray.map((date) => date.format(formatting)),
        dates: dateArray.map((date) => date.toDate()),
      };
    }
    default:
      return assertUnreachable(interval);
  }
}
