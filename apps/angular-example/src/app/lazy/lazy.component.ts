import { Component } from '@angular/core';
import { Abby } from '../abby';

@Component({
  selector: 'app-lazy',
  template: '<div>angularTest = {{angularTest}}</div>',
})
export class LazyComponent {
  angularTest: string;

  constructor(private readonly abby: Abby) {}

  ngOnInit() {
    this.abby.getVariant('AngularTest').subscribe((variant: string) => {
      this.angularTest = variant;
    });
  }
}
