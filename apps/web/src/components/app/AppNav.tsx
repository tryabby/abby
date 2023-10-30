import Link from "next/link";

import { cn } from "lib/utils";
import { useProjectId } from "lib/hooks/useProjectId";
import { useRouter } from "next/router";

const getItemClassName = (isActive: boolean) =>
  cn(
    "flex-none text-sm font-medium transition-colors hover:text-primary",
    !isActive && "text-muted-foreground"
  );
export function AppNav({
  className,
  linkClassName,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  linkClassName?: string;
}) {
  const currentProjectId = useProjectId();
  const router = useRouter();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href={`/projects/${currentProjectId}/flags`}
        className={cn(
          getItemClassName(
            router.pathname.endsWith("/projects/[projectId]/flags")
          ),
          linkClassName
        )}
      >
        Flags
      </Link>
      <Link
        href={`/projects/${currentProjectId}/remote-config`}
        className={cn(
          getItemClassName(
            router.pathname.endsWith("/projects/[projectId]/remote-config")
          ),
          linkClassName
        )}
      >
        Remote Config
      </Link>
      <Link
        href={`/projects/${currentProjectId}/environments`}
        className={cn(
          getItemClassName(
            router.pathname.endsWith("/projects/[projectId]/environments")
          ),
          linkClassName
        )}
      >
        Environments
      </Link>
      <Link
        href={`/projects/${currentProjectId}`}
        className={cn(
          getItemClassName(router.pathname.endsWith("/projects/[projectId]")),
          linkClassName
        )}
      >
        A/B Tests
      </Link>
      <Link
        href={`/projects/${currentProjectId}/settings`}
        className={cn(
          getItemClassName(
            router.pathname.endsWith("/projects/[projectId]/settings")
          ),
          linkClassName
        )}
      >
        Settings
      </Link>
    </nav>
  );
}
