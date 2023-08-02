import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { Subject, takeUntil, map, distinctUntilChanged, ReplaySubject, switchMap } from "rxjs";
import { AbbyService } from "./abby.service";

@Directive({
  selector: "[featureFlag]",
})
export class AbbyFlag implements OnInit, OnDestroy {
  @Input()
  set featureFlag(featureFlag: string) {
    // ensure featureFlag is a string to quit gracefully
    if(typeof featureFlag !== 'string') {
      console.warn(`Expected a string as featureFlag. Got ${featureFlag}`);
      return;
    }

    this.currentFlag$.next(featureFlag);
  }

  private currentFlag$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private readonly abby: AbbyService,
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    this.currentFlag$
      .pipe(
        switchMap((flagName) => {
          return this.abby
            .getFeatureFlagValue(flagName.startsWith("!") ? flagName.slice(1) : flagName)
            .pipe(
              map(
                (value) =>
                  (value && flagName[0] !== "!") || (flagName[0] === "!" && !value)
              )
            );
        }),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((visible) => {
        if (visible) {
          this._viewContainer.createEmbeddedView(this._templateRef);
        } else {
          this._viewContainer.clear();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
