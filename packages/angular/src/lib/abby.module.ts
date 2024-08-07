import {
  APP_INITIALIZER,
  InjectionToken,
  type ModuleWithProviders,
  NgModule,
  inject,
} from "@angular/core";
import type { AbbyConfig } from "@tryabby/core";
import { firstValueFrom } from "rxjs";
import { AbbyLoggerService } from "./abby-logger.service";
import { AbbyService } from "./abby.service";
import { DevtoolsComponent } from "./devtools.component";
import { AbbyFlag } from "./flag.directive";
import { GetRemoteConfigPipe } from "./get-remote-config.pipe";
import { GetAbbyVariantPipe } from "./get-variant.pipe";
import { AbbyTest } from "./test.directive";

export const ABBY_CONFIG_TOKEN = new InjectionToken<AbbyConfig>("AbbyConfig");

@NgModule({
  declarations: [
    AbbyFlag,
    AbbyTest,
    DevtoolsComponent,
    GetAbbyVariantPipe,
    GetRemoteConfigPipe,
  ],
  exports: [
    AbbyFlag,
    AbbyTest,
    DevtoolsComponent,
    GetAbbyVariantPipe,
    GetRemoteConfigPipe,
  ],
})
export class AbbyModule {
  static forRoot(config: AbbyConfig): ModuleWithProviders<AbbyModule> {
    return {
      ngModule: AbbyModule,
      providers: [
        {
          provide: AbbyLoggerService,
        },
        {
          provide: ABBY_CONFIG_TOKEN,
          useValue: config, // assuming 'config' is your configuration data
        },
        {
          provide: AbbyService,
          useFactory: (config: AbbyConfig) => {
            return new AbbyService(config, inject(AbbyLoggerService));
          },
          deps: [ABBY_CONFIG_TOKEN],
        },
        {
          provide: APP_INITIALIZER,
          useFactory: (abby: AbbyService) => () => firstValueFrom(abby.init()),
          deps: [AbbyService],
          multi: true,
        },
      ],
    };
  }
}
