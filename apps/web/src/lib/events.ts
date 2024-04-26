import dayjs from 'dayjs'

export enum SpecialTimeInterval {
  DAY = 'day',
  MONTH_TO_DATE = 'month',
  ALL_TIME = 'all',
}

export const INTERVALS = [
  {
    label: 'Today',
    value: SpecialTimeInterval.DAY,
  },
  // {
  //   label: "Last 7 days",
  //   value: "7d",
  // },
  {
    label: 'Last 30 days',
    value: '30d',
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
    label: 'All Time',
    value: SpecialTimeInterval.ALL_TIME,
  },
] as const

type INTERVAL = (typeof INTERVALS)[number]['value']

export function isValidInterval(interval: string): interval is INTERVAL {
  return INTERVALS.map((i) => i.value).includes(interval as INTERVAL)
}

export function isSpecialTimeInterval(timeInterval: string): timeInterval is SpecialTimeInterval {
  return Object.values(SpecialTimeInterval).includes(timeInterval as SpecialTimeInterval)
}

export function getMSFromSpecialTimeInterval(timeInterval: SpecialTimeInterval): number {
  switch (timeInterval) {
    case SpecialTimeInterval.DAY: {
      return 1000 * 60 * 60 * 24
    }
    case SpecialTimeInterval.MONTH_TO_DATE: {
      return new Date().getTime() - new Date().setDate(1)
    }
    case SpecialTimeInterval.ALL_TIME: {
      return Infinity
    }
  }
}

export function getFormattingByInterval(interval: INTERVAL) {
  switch (interval) {
    case SpecialTimeInterval.DAY: {
      return 'HH:mm'
    }
    case '30d': {
      return 'DD MMM'
    }
    case SpecialTimeInterval.ALL_TIME: {
      return 'MMM YY'
    }
  }
}

export function getLabelsByInterval(
  interval: (typeof INTERVALS)[number]['value'],
  fistEventDate: Date
): Array<string> {
  const formatting = getFormattingByInterval(interval)
  switch (interval) {
    case SpecialTimeInterval.DAY: {
      const baseData = dayjs().set('minute', 0)
      return [0, 3, 6, 9, 12, 15, 18, 21].map((hour) =>
        baseData.set('hour', hour).format(formatting)
      )
    }
    case '30d': {
      return Array.from({ length: 30 }, (_, i) =>
        dayjs().subtract(i, 'day').format(formatting)
      ).reverse()
    }
    case SpecialTimeInterval.ALL_TIME: {
      const diff = dayjs().diff(dayjs(fistEventDate), 'month')

      return Array.from({ length: Math.max(diff, 6) }, (_, i) =>
        dayjs(fistEventDate).add(i, 'month').format(formatting)
      ).reverse()
    }
  }
}
