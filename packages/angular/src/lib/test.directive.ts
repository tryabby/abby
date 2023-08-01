import {
  Directive,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";

import { AbbyService } from "./abby.service";

@Directive({
  selector: "[abbyTest]",
})
export class AbbyTest implements OnInit, OnDestroy {
  @Input() abbyTest: { testName: string; variant: string };

  private _destroy$ = new Subject<void>();

  constructor(
    private readonly abby: AbbyService,
    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    this.abby
      .getVariant(this.abbyTest.testName)
      .pipe(takeUntil(this._destroy$))
      .subscribe((selectedVariant: string) => {
        // Clear the viewContainer before creating a new view.
        this._viewContainer.clear();

        if (selectedVariant === this.abbyTest.variant) {
          this._viewContainer.createEmbeddedView(this._templateRef);
        }
      });
  }

    ngOnDestroy(): void {
      this._destroy$.next();
      this._destroy$.complete();
    }
}
