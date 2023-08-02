import { Component } from '@angular/core';
import { Abby } from '../abby';

@Component({
  selector: 'app-lazy',
  template: '<div>angularTest = {{ angularTest$ | async}}</div>',
})
export class LazyComponent {
  angularTest$ = this.abby.getVariant('AngularTest');

  constructor(private readonly abby: Abby) {}
}
