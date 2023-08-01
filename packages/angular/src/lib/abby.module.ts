import { APP_INITIALIZER, InjectionToken, ModuleWithProviders, NgModule } from "@angular/core";
import { AbbyService } from "./abby.service";
import { Abby, AbbyConfig } from "@tryabby/core";
import { AbbyFlag } from "./flag.directive";
import { AbbyTest } from "./test.directive";
import { DevtoolsComponent } from "./devtools.component";
import { F } from "ts-toolbelt";
import { firstValueFrom } from "rxjs";

export const ABBY_CONFIG_TOKEN = new InjectionToken<AbbyConfig>("AbbyConfig");

@NgModule({
  declarations: [AbbyFlag, AbbyTest, DevtoolsComponent],
  exports: [AbbyFlag, AbbyTest, DevtoolsComponent],
})
export class AbbyModule {
  static forRoot(config: AbbyConfig): ModuleWithProviders<AbbyModule> {
    return {
      ngModule: AbbyModule,
      providers: [
        {
          provide: ABBY_CONFIG_TOKEN,
          useValue: config, // assuming 'config' is your configuration data
        },
        {
          provide: AbbyService,
          useFactory: (config: AbbyConfig) => {
            return new AbbyService(config as F.Narrow<AbbyConfig>);
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
