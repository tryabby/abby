import {
  APP_INITIALIZER,
  inject,
  InjectionToken,
  ModuleWithProviders,
  NgModule,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { F } from "ts-toolbelt";
import { AbbyLoggerService } from "./abby-logger.service";
import { AbbyConfig } from "@tryabby/core";
import { AbbyService } from "./abby.service";
import { DevtoolsComponent } from "./devtools.component";
import { AbbyFlag } from "./flag.directive";
import { AbbyTest } from "./test.directive";
import { GetAbbyVariantPipe } from "./get-variant.pipe";
import { GetRemoteConfigPipe } from "./get-remote-config.pipe";

export const ABBY_CONFIG_TOKEN = new InjectionToken<AbbyConfig>("AbbyConfig");

@NgModule({
  declarations: [AbbyFlag, AbbyTest, DevtoolsComponent, GetAbbyVariantPipe, GetRemoteConfigPipe],
  exports: [AbbyFlag, AbbyTest, DevtoolsComponent, GetAbbyVariantPipe, GetRemoteConfigPipe],
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
