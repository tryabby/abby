import { Component, OnInit } from '@angular/core';
import { Abby } from './abby';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  angularTest: string;
  angularFlag: boolean;
  constructor(public readonly abby: Abby) {}

  ngOnInit() {
    this.abby.getVariant('AngularTest').subscribe((value: string) => {
      this.angularTest = value;
    });

    this.abby.getFeatureFlagValue('AngularFlag').subscribe((value: boolean) => {
      this.angularFlag = value;
    });
  }

  public onAct(): void {
    this.abby.onAct('AngularTest');
  }
}
