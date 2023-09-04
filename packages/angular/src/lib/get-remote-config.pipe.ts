import { Pipe, PipeTransform } from "@angular/core";
import { RemoteConfigValueString, RemoteConfigValueStringToType } from "@tryabby/core";
import { Observable } from "rxjs";
import { AbbyService } from "./abby.service";

@Pipe({
  name: "getAbbyRemoteConfig",
})
export class GetRemoteConfigPipe<RemoteConfig extends Record<string, RemoteConfigValueString>>
  implements PipeTransform
{
  constructor(private abbyService: AbbyService) {}

  transform<T extends Extract<keyof RemoteConfig, string>>(
    value: T
  ): Observable<RemoteConfigValueStringToType<RemoteConfig[T]>> {
    return this.abbyService.getRemoteConfig(value) as Observable<
      RemoteConfigValueStringToType<RemoteConfig[T]>
    >;
  }
}
