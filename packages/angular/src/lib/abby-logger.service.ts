import { Inject, Injectable } from "@angular/core";
import type { AbbyConfig } from "@tryabby/core";
import { ABBY_CONFIG_TOKEN } from "./abby.module";

@Injectable()
export class AbbyLoggerService {
  readonly LOGGER_SCOPE = "ng.Abby";

  constructor(@Inject(ABBY_CONFIG_TOKEN) private config: AbbyConfig) {}

  log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log(this.LOGGER_SCOPE, ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.config.debug) {
      console.warn(this.LOGGER_SCOPE, ...args);
    }
  }
}
