import {APP_INITIALIZER, InjectionToken, ModuleWithProviders, NgModule} from "@angular/core";
import { AbbyService } from "./abby.service";
import { AbbyConfig } from "@tryabby/core";
import { AbbyFlag } from "./flag.directive";
import { AbbyTest } from "./test.directive";
import { DevtoolsComponent } from "./devtools.component";

export const ABBY_CONFIG_TOKEN = new InjectionToken<AbbyConfig>('AbbyConfig');

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
            return new AbbyService(config);
          },
          deps: [ABBY_CONFIG_TOKEN]
        },
        {
          provide: APP_INITIALIZER,
          useFactory: (abby: AbbyService) => {
            return (): Promise<any> => {
              return new Promise((resolve, reject) => {
                abby.init().subscribe({
                  next: () => resolve('Initialization Successful.'),
                  error: (err) => reject(err)
                });
              });
            };
          },
          deps: [AbbyService],
          multi: true,
        },
      ],
    };
  }
}
