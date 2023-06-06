import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from "@angular/core";

import { AbbyService } from "./abby.service";

@Directive({
  selector: "[featureFlag]",
})
export class AbbyFlag implements OnInit {
  @Input() featureFlag: string;

  constructor(
    private readonly abby: AbbyService,

    private _viewContainer: ViewContainerRef,
    private _templateRef: TemplateRef<any>
  ) {}

  ngOnInit(): void {
    let flagName: string;
    if (this.featureFlag.startsWith("!"))
      flagName = this.featureFlag.substring(1);
    else flagName = this.featureFlag;
    this.abby.getFeatureFlagValue(flagName).subscribe((value: boolean) => {
      this._viewContainer.clear();
      if (
        (value && this.featureFlag[0] != "!") ||
        (this.featureFlag[0] == "!" && !value)
      ) {
        this._viewContainer.createEmbeddedView(this._templateRef);
      }
    });
  }
}
