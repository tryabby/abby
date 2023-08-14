import { Pipe, PipeTransform } from "@angular/core";
import { ABConfig, ExtractVariants } from "@tryabby/core";
import { Observable } from "rxjs";
import { Key } from "ts-toolbelt/out/Any/Key";
import { AbbyService } from "./abby.service";

@Pipe({
  name: "getAbbyVariant",
})
export class GetAbbyVariantPipe<TestName extends Key, Tests extends Record<TestName, ABConfig>>
  implements PipeTransform
{
  constructor(private abbyService: AbbyService<string, string, Tests>) {}

  transform(testName: TestName): Observable<string>;
  transform<S>(
    testName: TestName,
    lookupObject: Record<ExtractVariants<TestName, Tests>, S>
  ): Observable<S>;
  transform<S>(
    testName: TestName,
    lookupObject?: Record<ExtractVariants<TestName, Tests>, S>
  ): Observable<string | S> {
    return this.abbyService.getVariant(testName, lookupObject);
  }
}
