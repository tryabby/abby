import { AfterDataRequest } from "./AfterDataRequest";
import { Job } from "./types";

type JobTypeMapping = {
  "after-data-request": AfterDataRequest;
};

export class JobManager {
  private jobs = new Map<string, Job<any>>();

  constructor() {}

  register(job: new () => Job<any>): JobManager {
    const jobInstance = new job();
    this.jobs.set(jobInstance.type, jobInstance);
    return this;
  }

  async start(): Promise<void> {
    // await this.boss.start();
    for (const job of this.jobs.values()) {
      await job.start();
    }
  }

  async emit<K extends keyof JobTypeMapping>(
    jobName: K,
    data: Parameters<JobTypeMapping[K]["emit"]>[0]
  ): Promise<void> {
    const job = this.jobs.get(jobName);
    if (job === undefined) {
      throw new Error(`No job registered with the name ${jobName}`);
    }

    await job.emit(data);
  }
}

export const jobManager = new JobManager().register(AfterDataRequest);
