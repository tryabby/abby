import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AbbyModule } from 'abby';
import { Abby, abby } from './abby';
import { ATestComponent } from './test_components/a.component';
import { BTestComponent } from './test_components/b.component';
import { CTestComponent } from './test_components/c.component';
import { DTestComponent } from './test_components/d.component';
import { FlagComponent } from './test_components/flag.component';

@NgModule({
  declarations: [
    AppComponent,
    ATestComponent,
    BTestComponent,
    CTestComponent,
    DTestComponent,
    FlagComponent,
  ],
  imports: [
    ///BrowserModule.withServerTransition({ appId: 'angular-example' }), // for SSR
    BrowserModule,
    AppRoutingModule,
    AbbyModule.forRoot(abby),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
