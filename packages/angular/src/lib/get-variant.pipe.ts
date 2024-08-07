import { Pipe, PipeTransform } from "@angular/core";
import { ABConfig } from "@tryabby/core";
import { Observable } from "rxjs";
import { Key } from "ts-toolbelt/out/Any/Key";
import { AbbyService } from "./abby.service";

@Pipe({
  name: "getAbbyVariant",
})
export class GetAbbyVariantPipe<
  const TestName extends Key,
  const Tests extends Record<TestName, ABConfig>,
> implements PipeTransform
{
  constructor(private abbyService: AbbyService<string, string, Tests>) {}

  transform(testName: TestName): Observable<string> {
    return this.abbyService.getVariant(testName);
  }
}
