import { NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { ATestComponent } from './test_components/a.component';
import { BTestComponent } from './test_components/b.component';
import { CTestComponent } from './test_components/c.component';
import { DTestComponent } from './test_components/d.component';
import { FlagComponent } from './test_components/flag.component';
import { Abby } from './abby';
import { combineLatest } from 'rxjs';

@NgModule({
  imports: [
    RouterModule.forRoot([], {
      initialNavigation: 'enabledBlocking',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {
  constructor(private abby: Abby, private router: Router) {
    // we are using `combineLatest` here, as the devtools can dynamically
    // change the state of our feature flags during runtime.
    // In a live environment, where flags and variants are determined once,
    // you can use `forkJoin` here
    combineLatest({
      angularTest: abby.getVariant('AngularTest'),
      angularFlag: abby.getFeatureFlagValue('AngularFlag'),
    }).subscribe(({ angularTest, angularFlag }) => {
      this.router.resetConfig([
        {
          path: 'lazy',
          loadChildren: () =>
            import('./lazy/lazy.module').then((m) => m.LazyModule),
          outlet: 'lazy',
        },
        this.abby.getRouterVariant(angularTest, {
          path: 'test',
          outlet: 'test',
          abbyVariants: {
            A: {
              title: 'TEST A',
              component: ATestComponent,
            },
            B: {
              title: 'TEST B',
              component: BTestComponent,
            },
            C: {
              title: 'TEST C',
              component: CTestComponent,
            },
            D: {
              title: 'TEST D',
              component: DTestComponent,
            },
          },
        }),
        {
          ...(angularFlag
            ? {
                path: 'flag',
                title: 'Flag',
                component: FlagComponent,
                outlet: 'flag',
              }
            : undefined),
        },
      ]);
    });
  }
}
