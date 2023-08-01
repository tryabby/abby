import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { shareReplay } from "rxjs";
import { Abby } from "./abby";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  angularTest$ = this.abby.getVariant("AngularTest").pipe(shareReplay(1));
  angularFlag$ = this.abby.getFeatureFlagValue("AngularFlag").pipe(shareReplay(1));

  dynamicFeatureFlag = new FormControl();

  constructor(public readonly abby: Abby) {}

  public onAct(): void {
    this.abby.onAct("AngularTest");
  }
}
