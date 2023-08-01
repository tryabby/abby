import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { AbbyService } from "./abby.service";

@Directive({
  selector: "[featureFlag]",
})
export class AbbyFlag implements OnInit, OnDestroy {
  @Input() featureFlag: string;

  private _destroy$ = new Subject<void>();

  constructor(
    private readonly abby: AbbyService,
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    const flagName = this.featureFlag.startsWith("!")
      ? this.featureFlag.substring(1)
      : this.featureFlag;

    this.abby
      .getFeatureFlagValue(flagName)
      .pipe(takeUntil(this._destroy$))
      .subscribe((value) => {
        this._viewContainer.clear();
        if (
          (value && this.featureFlag[0] != "!") || 
          (this.featureFlag[0] == "!" && !value)
        ) {
          this._viewContainer.createEmbeddedView(this._templateRef);
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
