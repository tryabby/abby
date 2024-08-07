import { Input, type OnInit, ViewChild } from "@angular/core";
import { Component, type ElementRef } from "@angular/core";
import type { AbbyDevtoolProps } from "@tryabby/devtools";
import abbyDevTool from "@tryabby/devtools";
// biome-ignore lint/style/useImportType: angular
import { AbbyService } from "./abby.service";

@Component({
  selector: "abby-devtools",
  template: "<ng-container #devtoolsContainer></ng-container>",
})
export class DevtoolsComponent implements OnInit {
  @Input() props: Omit<AbbyDevtoolProps, "abby">;
  @ViewChild("devtoolsContainer", { static: true })
  devtoolsContainerRef!: ElementRef;

  constructor(private readonly abby: AbbyService) {}

  ngOnInit(): void {
    if (
      // biome-ignore lint/complexity/useLiteralKeys: angular
      this.props?.["dangerouslyForceShow"] ||
      // biome-ignore lint/complexity/useLiteralKeys: angular
      process.env["NODE_ENV"] === "development"
    ) {
      const abbyInstance = this.abby.getAbbyInstance();

      abbyDevTool.create({
        ...this.props,
        abby: abbyInstance,
      });
    }
  }
}
