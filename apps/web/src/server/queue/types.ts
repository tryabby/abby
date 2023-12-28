export interface LibraryJob<T> {
  data: T;
}

export type JobType = "after-data-request";

export interface Job<T extends object> {
  type: JobType;
  //   options: pgBoss.SendOptions;
  start: () => Promise<void>;
  work: (job: LibraryJob<T>) => Promise<void>;
  emit: (data: T) => Promise<void>;
}

export abstract class BaseJob<T extends object> implements Job<T> {
  abstract readonly type: JobType;
  readonly options = { retryLimit: 3, retryDelay: 1000 };

  constructor() {}

  async start(): Promise<void> {
    // await this.boss.work(this.type, this.work);
  }

  abstract work(job: LibraryJob<T>): Promise<void>;

  async emit(data: T): Promise<void> {
    // await this.boss.send(this.type, data, this.options);
  }
}
