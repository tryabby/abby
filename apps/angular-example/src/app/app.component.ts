import { Component } from "@angular/core";
import { FormControl } from "@angular/forms";
import { map } from "rxjs";
import { Abby } from "./abby";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  angularTest$ = this.abby.getVariant("AngularTest");
  angularFlag$ = this.abby.getFeatureFlagValue("AngularFlag");

  variantWithLookup$ = this.abby.getVariant("AngularTest", {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
  });

  headerColor$ = this.angularTest$.pipe(
    map((angularTest) => {
      switch(angularTest) {
        case 'A':
          return 'blue';
        case 'B':
          return 'green';
        case 'C':
          return 'yellow';
        case 'D':
          return 'pink';
        default:
          return 'grey';
      }
    })
  );

  dynamicFeatureFlag = new FormControl<string | null>(null);

  constructor(public readonly abby: Abby) {}

  public onAct(): void {
    this.abby.onAct("AngularTest");
  }
}
