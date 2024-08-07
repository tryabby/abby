import { Pipe, type PipeTransform } from "@angular/core";
import type { ABConfig } from "@tryabby/core";
import type { Observable } from "rxjs";
import type { Key } from "ts-toolbelt/out/Any/Key";
// biome-ignore lint/style/useImportType: angular needs this
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
