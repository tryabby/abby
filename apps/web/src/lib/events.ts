import dayjs from "dayjs";

export enum TIME_INTERVAL {
  DAY = "day",
  ALL_TIME = "all",
}

export const INTERVALS = [
  {
    label: "Today",
    value: TIME_INTERVAL.DAY,
  },
  // {
  //   label: "Last 7 days",
  //   value: "7d",
  // },
  {
    label: "Last 30 days",
    value: "30d",
  },
  // {
  //   label: "Year to Date",
  //   value: SpecialTimeInterval.MONTH_TO_DATE,
  // },
  // {
  //   label: "Last 12 months",
  //   value: "12mo",
  // },
  {
    label: "All Time",
    value: TIME_INTERVAL.ALL_TIME,
  },
] as const;

export function isValidInterval(interval: string): interval is TIME_INTERVAL {
  return INTERVALS.map((i) => i.value).includes(interval as TIME_INTERVAL);
}

export function isSpecialTimeInterval(
  timeInterval: string
): timeInterval is TIME_INTERVAL {
  return Object.values(TIME_INTERVAL).includes(timeInterval as TIME_INTERVAL);
}

export function getMSFromSpecialTimeInterval(
  timeInterval: TIME_INTERVAL
): number {
  switch (timeInterval) {
    case TIME_INTERVAL.DAY: {
      return 1000 * 60 * 60 * 24;
    }
    case TIME_INTERVAL.ALL_TIME: {
      return Number.POSITIVE_INFINITY;
    }
  }
}

export function getFormattingByInterval(interval: string) {
  switch (interval) {
    case TIME_INTERVAL.DAY: {
      return "HH:mm";
    }
    case "30d": {
      return "DD MMM";
    }
    case TIME_INTERVAL.ALL_TIME: {
      return "MMM YY";
    }
    default: {
      return "DD MMM";
    }
  }
}

export function getBaseEventsByInterval(
  interval: string,
  variants: string[],
  firstEventDate: Date
) {
  const variantData = variants.reduce(
    (acc, variant) => {
      acc[variant] = 0;
      return acc;
    },
    {} as Record<string, number>
  );
  switch (interval) {
    case TIME_INTERVAL.DAY: {
      const baseData = dayjs().startOf("day");
      return [0, 3, 6, 9, 12, 15, 18, 21].map((hour) => ({
        date: baseData.set("hour", hour).toISOString(),
        ...variantData,
      }));
    }
    case "30d": {
      return Array.from({ length: 30 }, (_, i) => ({
        date: dayjs().subtract(i, "day").startOf("day").toISOString(),
        ...variantData,
      })).toReversed();
    }
    case TIME_INTERVAL.ALL_TIME: {
      const diff = dayjs().diff(dayjs(firstEventDate), "month");

      return Array.from({ length: Math.max(diff, 6) }, (_, i) => ({
        date: dayjs(firstEventDate)
          .add(i, "month")
          .startOf("day")
          .toISOString(),
        ...variantData,
      })).toReversed();
    }
  }
}

export function getLabelsByInterval(
  interval: (typeof INTERVALS)[number]["value"],
  fistEventDate: Date
): Array<string> {
  const formatting = getFormattingByInterval(interval);
  switch (interval) {
    case TIME_INTERVAL.DAY: {
      const baseData = dayjs().set("minute", 0);
      return [0, 3, 6, 9, 12, 15, 18, 21].map((hour) =>
        baseData.set("hour", hour).format(formatting)
      );
    }
    case "30d": {
      return Array.from({ length: 30 }, (_, i) =>
        dayjs().subtract(i, "day").format(formatting)
      ).reverse();
    }
    case TIME_INTERVAL.ALL_TIME: {
      const diff = dayjs().diff(dayjs(fistEventDate), "month");

      return Array.from({ length: Math.max(diff, 6) }, (_, i) =>
        dayjs(fistEventDate).add(i, "month").format(formatting)
      ).reverse();
    }
  }
}
