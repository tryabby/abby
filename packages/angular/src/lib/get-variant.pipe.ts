import { Pipe, PipeTransform } from "@angular/core";
import { ABConfig } from "@tryabby/core";
import { Observable } from "rxjs";
import { AbbyService, ExtractVariants } from "./abby.service";

@Pipe({
  name: "getAbbyVariant",
})
export class GetAbbyVariantPipe<TestName extends string, Tests extends Record<TestName, ABConfig>>
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
    if (lookupObject === undefined) {
      return this.abbyService.getVariant(testName);
    }

    return this.abbyService.getVariant(testName, lookupObject);
  }
}
