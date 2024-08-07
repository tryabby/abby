// biome-ignore lint/style/useImportType: angular needs this
import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import { Subject, distinctUntilChanged, map, takeUntil } from "rxjs";

// biome-ignore lint/style/useImportType: angular needs this
import { AbbyService } from "./abby.service";

@Directive({
  selector: "[abbyTest]",
})
export class AbbyTest implements OnInit, OnDestroy {
  @Input() abbyTest: { testName: string; variant: string };

  private destroy$ = new Subject<void>();

  constructor(
    private readonly abby: AbbyService,
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    this.abby
      .getVariant(this.abbyTest.testName)
      .pipe(
        map((selectedVariant) => selectedVariant === this.abbyTest.variant),
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
