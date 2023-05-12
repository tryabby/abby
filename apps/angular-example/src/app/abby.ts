import { Injectable } from '@angular/core';
import { AbbyService } from 'abby';
import { environment } from '../environments/environment';

export const abby = {
  projectId: environment.ABBY_PROJECT_ID,
  currentEnvironment: 'test',
  tests: {
    AngularTest: {
      variants: ['A', 'B', 'C', 'D'],
    },
    NotExistingTest: {
      variants: ['A', 'B'],
    },
  },
  flags: ['AngularFlag', 'AngularFlag2', 'NotExistingFlag'],
  apiUrl: 'http://localhost:3000/',
  debug: true,
};

@Injectable({
  providedIn: 'root',
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  (typeof abby)['flags'][number],
  keyof (typeof abby)['tests']
> {}
