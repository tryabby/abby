import { Directive, Input, OnDestroy, TemplateRef, ViewContainerRef } from "@angular/core";
import { distinctUntilChanged, Subject, switchMap, takeUntil } from "rxjs";
import { AbbyLoggerService } from "./abby-logger.service";
import { AbbyService } from "./abby.service";

@Directive({
  selector: "[abbyFlag]",
})
export class AbbyFlag implements OnDestroy {
  @Input()
  set abbyFlag(featureFlag: string) {
    // ensure featureFlag is a string to quit gracefully
    if (typeof featureFlag !== "string") {
      this.abbyLogger.warn(`Expected a string as featureFlag. Got ${featureFlag}`);
      return;
    }

    this.currentFlag$.next(featureFlag);
  }

  private currentFlag$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private readonly abby: AbbyService,
    private readonly abbyLogger: AbbyLoggerService,
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {
    this.currentFlag$
      .pipe(
        switchMap((flagName) => this.abby.getFeatureFlagValue(flagName)),
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
