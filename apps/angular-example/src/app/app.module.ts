import { APP_INITIALIZER, Injectable, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import abbyConfig from "../../abby.config";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AbbyModule, AbbyService } from "abby";
import { ATestComponent } from "./test_components/a.component";
import { BTestComponent } from "./test_components/b.component";
import { CTestComponent } from "./test_components/c.component";
import { DTestComponent } from "./test_components/d.component";
import { FlagComponent } from "./test_components/flag.component";
import { ReactiveFormsModule } from "@angular/forms";

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
    AbbyModule.forRoot(abbyConfig),
    ReactiveFormsModule,
  ],
  providers: [],

  bootstrap: [AppComponent],
})
export class AppModule {}
