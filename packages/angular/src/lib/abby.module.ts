import { ModuleWithProviders, NgModule } from "@angular/core";
import { AbbyService } from "./abby.service";
import { AbbyConfig } from "@tryabby/core";
import { AbbyFlag } from "./flag.directive";
import { AbbyTest } from "./test.directive";
import { DevtoolsComponent } from "./devtools.component";

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
          provide: AbbyService,
          useFactory: () => {
            return new AbbyService(config);
          },
        },
      ],
    };
  }
}
