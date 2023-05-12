import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";

import { AbbyService } from "./abby.service";

@Directive({
  selector: "[abbyTest]",
})
export class AbbyTest implements OnInit {
  @Input() abbyTest: { testName: string; variant: string };

  constructor(
    private readonly abby: AbbyService,

    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    this.abby
      .getVariant(this.abbyTest.testName)
      .subscribe((selectedVariant: string) => {
        if (selectedVariant == this.abbyTest.variant) {
          this._viewContainer.createEmbeddedView(this._templateRef);
        }
      });
  }
}

export interface AbbyTestConfig {
  testName: string;
  variant: string;
}
