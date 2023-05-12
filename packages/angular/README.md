# @tryabby/angular

## AbbyModule

The AbbyModule is an Angular module that provides a service and some directives to work with A/BBY.
You can then use the AbbyService in your components or services to interact with the Abby platform. The AbbyFlag, AbbyTest and DevtoolsComponent directives can be used in your templates to show/hide content based on feature flags or AB tests.

### Parameters

The `AbbyModule.forRoot()` method takes an object as a parameter. The object can contain the following properties:

| Name               | Type            | Required | Description                                             | details               |
| ------------------ | --------------- | :------: | ------------------------------------------------------- | --------------------- |
| projectId          | `string`        |    ✅    | The ID of your project in Abby                          | -                     |
| apiUrl             | `string`        |          | The URL of the Abby API. Defaults to the hosted version | -                     |
| currentEnvironment | `string`        |    ✅    | The current environment of your application             | [link](/environments) |
| tests              | `object`        |          | An object containing your defined A/B Tests             | -                     |
| flags              | `Array<string>` |          | An array containing your defined Feature Flags          | -                     |
| settings           | `object`        |          | An object with additional settings for A/BBY            | -                     |

#### properties

##### tests

The tests property is an object containing your defined A/B Tests. You probably want to use the Copy Button in your dashboard to copy the tests object.
They keys of the object represent the names of your predefined A/B tests. The values are objects containing the following properties:

| Name     | Type            | Required | Description                                             |
| -------- | --------------- | :------: | ------------------------------------------------------- |
| variants | `Array<string>` |    ✅    | An array of strings containing the variants of the test |

##### flags

The flags property is an array containing your defined Feature Flags. You probably want to use the Copy Button in your dashboard to copy the flags array.

##### Example

###### abby.ts

```ts
export const abby = {
  // ..your config
  tests: {
    test: {
      variants: ["control", "variant-a", "variant-b"],
    },
    flags: ["test-flag"],
  },
};

@Injectable({
  providedIn: "root",
  useExisting: AbbyService,
})
export class Abby extends AbbyService<
  (typeof abby)["flags"][number],
  keyof (typeof abby)["tests"]
> {}
```

###### app.module.ts

```ts
import { AbbyModule } from "abby";
import { Abby, abby } from "./abby";

@NgModule({
  // your config
  imports: [
    // your imports
    AbbyModule.forRoot(abby),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: (abby: Abby) => () => abby.init(),
      deps: [Abby],
      multi: true,
    },
  ],
})
export class AppModule {}
```

#### settings

The settings property is an object containing additional settings for A/BBY. The following properties are available:

- `flags.devDefault`: A boolean to set the default value of all feature flags in development mode. Defaults to `true`.

- `flags.default`: A boolean to set the default value of all feature flags in production mode. Defaults to `false`.

- `flags.devOverrides`: An object containing the values of feature flags in development mode. The keys of the object represent the names of the flags.
  The values are booleans.

## AbbyService

- `AbbyService` is a angular service, which provides methods for getting

### getVariant(testName: string)

Resolves the selected variant for a given test name.

#### Parameters

The name of the test, needs to be one of the defined tests.

#### Return Value

The variant of the test _Type: `string`_

### getFeatureFlagValue(flagName: string)

Resolves the value of a feature flag by the flagname.

#### Parameters

The name of the test or flag, needs to be one of the defined flags.

#### Return Value

The value of the flag _Type: `boolean`_

### onAct

A function to call when the user performs an action associated with the test _Type: `function`_

## Directives

### Test Directive

The `AbbyTest` is an Angular directive provided by @tryabby/angular package that enables conditional rendering of components based on the selected variant of an A/B test. It works in conjunction with the AbbyService and is used to wrap the HTML code to be conditionally rendered.

#### Parameters

- `testName`: The name of the test, needs to be one of the defined tests.
- `variant`: The name of the variant to compare with the selected variant of the test.

#### Example

```html
<ng-container *abbyTest="{ testName: 'test-abtest', variant: 'variant-a' }"
  >AAAAAA</ng-container
>
<ng-container *abbyTest="{ testName: 'test-abtest', variant: 'variant-b' }"
  >BBBBBB</ng-container
>
```

### Flag Directive

The AbbyFlag is an Angular directive provided by @tryabby/core package that enables conditional rendering of components based on the value of a feature flag. It works in conjunction with the AbbyService and is used to wrap the HTML code to be conditionally rendered.

#### Parameters

The name of the feature flag. The name can be prefixed with ! to invert the flag value.

#### Example

```html
<div *featureFlag="'test-flag'"></div>
```

## Devtool Component

The DevtoolsComponent is an Angular component provided by @tryabby/angular package that renders the Abby Devtools in your application. The component is used to wrap the HTML code that renders the Abby Devtools.

### Example

```html
<abby-devtools></abby-devtools>
```

<!-- # Angular

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.0.

## Code scaffolding

Run `ng generate component component-name --project angular` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project angular`.

> Note: Don't forget to add `--project angular` or else it will be added to the default project in your `angular.json` file.

## Build

Run `ng build angular` to build the project. The build artifacts will be stored in the `dist/` directory.

## Publishing

After building your library with `ng build angular`, go to the dist folder `cd dist/angular` and run `npm publish`.

## Running unit tests

Run `ng test angular` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page. -->
