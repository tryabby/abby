import { Mail, Code, HelpCircle, Book, Video } from "lucide-react";
import { CodeSnippetModalButton } from "./CodeSnippetModalButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { IconButton } from "./IconButton";
import Link from "next/link";
import { DOCS_URL } from "@tryabby/core";
import { useTracking } from "lib/tracking";
import { FaDiscord } from "react-icons/fa";
import { DISCORD_INVITE_URL } from "./Footer";

type Props = {
  title: string;
};

export function DashboardHeader({ title }: Props) {
  const trackEvent = useTracking();
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <IconButton
              as="div"
              // all other events are prevented by radix :(
              onPointerDown={() => {
                trackEvent("Dashboard Help Clicked");
              }}
              icon={<HelpCircle />}
              title=""
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end">
            <DropdownMenuItem disabled>Need help?</DropdownMenuItem>
            <Link href={DOCS_URL}>
              <DropdownMenuItem>
                <Book className="mr-2 h-4 w-4" />
                Documentation
              </DropdownMenuItem>
            </Link>
            <Link href="mailto:tim@tryabby.com">
              <DropdownMenuItem>
                <Mail className="mr-2 h-4 w-4" />
                Send a Mail
              </DropdownMenuItem>
            </Link>
            <Link href="https://cal.com/tim-raderschad/abby-help">
              <DropdownMenuItem>
                <Video className="mr-2 h-4 w-4" />
                Book a free Call
              </DropdownMenuItem>
            </Link>
            <Link href={DISCORD_INVITE_URL}>
              <DropdownMenuItem>
                <FaDiscord className="mr-2 h-4 w-4" />
                Join our Discord
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
        <CodeSnippetModalButton />
      </div>
    </div>
  );
}
