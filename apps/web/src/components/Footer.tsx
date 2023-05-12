import { Github } from "lucide-react";
import { BsDiscord } from "react-icons/bs";
import Link from "next/link";
import { DOCS_URL } from "shared";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container px-6 py-6 md:px-16 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h1 className="mb-3 text-2xl font-bold">A/BBY</h1>
            <h2 className="mb-8 text-gray-400">
              A simple and easy to use A/B testing & Feature Flags tool for
              developers.
            </h2>
          </div>
          <div className="flex flex-col gap-y-4 md:gap-0">
            <h1 className="mb-2 text-2xl font-bold md:mb-3">Integrations</h1>
            <Link
              href={`${DOCS_URL}integrations/react`}
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              React
            </Link>
            <Link
              href={`/nextjs`}
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Next.js
            </Link>
          </div>
          <div className="flex flex-col gap-y-4 md:gap-0">
            <h1 className="mb-2 text-2xl font-bold md:mb-3">Links</h1>
            <Link
              href={`/blog`}
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Blog
            </Link>
            <Link
              href={DOCS_URL}
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Documentation
            </Link>
            <Link
              href="https://discord.gg/nk7wKf7Pv2"
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Discord
            </Link>
          </div>
          <div className="flex flex-col gap-y-4 md:gap-0">
            <h1 className="mb-2 text-2xl font-bold md:mb-3">Legal</h1>
            <Link
              href="/imprint"
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Imprint
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-gray-400 transition-colors duration-200 hover:text-pink-300"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="flex flex-col justify-between gap-y-4 border-t border-gray-600 px-6 py-6 text-gray-400 sm:flex-row md:px-16">
          <p>© {new Date().getFullYear()} A/BBY. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <a href="https://github.com/tryabby">
              <Github className="transition-colors duration-200 hover:text-pink-300" />
            </a>
            <a href="https://discord.gg/nk7wKf7Pv2">
              <BsDiscord
                size={24}
                className="transition-colors duration-200 hover:text-pink-300"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
