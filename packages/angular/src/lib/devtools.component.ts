import { OnInit, ViewChild } from "@angular/core";
import { ElementRef, Component } from "@angular/core";
import { AbbyDevtoolProps } from "@tryabby/devtools";
import { AbbyService } from "./abby.service";
import abbyDevTool from "@tryabby/devtools";

@Component({
  selector: "abby-devtools",
  template: "<ng-container #devtoolsContainer></ng-container>",
})
export class DevtoolsComponent implements OnInit {
  props: Omit<AbbyDevtoolProps, "abby">;
  @ViewChild("devtoolsContainer", { static: true })
  devtoolsContainerRef!: ElementRef;

  constructor(private readonly abby: AbbyService) {}

  ngOnInit(): void {
    const abbyInstance = this.abby.getAbbyInstance();

    abbyDevTool.create({
      ...this.props,
      abby: abbyInstance,
    });
  }
}
