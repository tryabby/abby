import { DOCS_URL } from "@tryabby/core";
import { Button } from "components/ui/button";
import { useProjectId } from "lib/hooks/useProjectId";
import { useTracking } from "lib/tracking";
import { Book, HelpCircle, Mail, Video } from "lucide-react";
import { NextSeo } from "next-seo";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaDiscord } from "react-icons/fa";
import { twMerge } from "tailwind-merge";
import { trpc } from "../utils/trpc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { DISCORD_INVITE_URL } from "./Footer";
import ProjectSwitcher from "./ProjectSwitcher";
import { AppNav } from "./app/AppNav";
import { UserNav } from "./app/UserNav";

export const Layout = ({ children }: { children: ReactNode }) => {
  const trackEvent = useTracking();
  const currentProjectId = useProjectId();
  const { data } = trpc.user.getProjects.useQuery();

  const currentProject = data?.projects.find(
    ({ project }) => project.id === currentProjectId
  );

  return (
    <>
      <NextSeo title={currentProject?.project.name} />
      <div className={twMerge("dark flex h-screen flex-col bg-background")}>
        <nav className="px-8 py-3 border-b border-border lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8">
              {!currentProject ? null : (
                <>
                  <ProjectSwitcher />
                  <AppNav className="hidden md:flex" />
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hidden md:flex"
                    // all other events are prevented by radix :(
                    onPointerDown={() => {
                      trackEvent("Dashboard Help Clicked");
                    }}
                    title=""
                  >
                    <HelpCircle />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem disabled>Need help?</DropdownMenuItem>
                  <Link href={DOCS_URL}>
                    <DropdownMenuItem>
                      <Book className="w-4 h-4 mr-2" />
                      Documentation
                    </DropdownMenuItem>
                  </Link>
                  <Link href="mailto:tim@tryabby.com">
                    <DropdownMenuItem>
                      <Mail className="w-4 h-4 mr-2" />
                      Send a Mail
                    </DropdownMenuItem>
                  </Link>
                  <Link href="https://cal.com/cstrnt/abby-help">
                    <DropdownMenuItem>
                      <Video className="w-4 h-4 mr-2" />
                      Book a free Call
                    </DropdownMenuItem>
                  </Link>
                  <Link href={DISCORD_INVITE_URL}>
                    <DropdownMenuItem>
                      <FaDiscord className="w-4 h-4 mr-2" />
                      Join our Discord
                    </DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
              <UserNav />
            </div>
          </div>
          <AppNav
            className="min-w-full py-3 mt-3 overflow-x-auto md:hidden"
            linkClassName="flex-none"
          />
        </nav>
        <main className="relative flex-1 w-full overflow-x-hidden overflow-y-auto text-white">
          <div className="h-full p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </>
  );
};
