import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  forwardRef,
  Fragment,
  MouseEvent,
  ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { FiServer } from "react-icons/fi";
import { MdSettings, MdSpaceDashboard, MdAdd } from "react-icons/md";
import { RiToggleLine } from "react-icons/ri";
import { trpc } from "../utils/trpc";
import { Select } from "./Select";
import { UserInfo } from "./UserInfo";
import { CreateProjectModal } from "./CreateProjectModal";
import { useSession } from "next-auth/react";
import { twMerge } from "tailwind-merge";

const navItemClass = (isActive: boolean) =>
  clsx(
    "flex items-center rounded-lg px-4 py-2 text-lg font-bold hover:bg-gray-600 transition-colors ease-in-out duration-150",
    {
      "bg-gray-700": isActive,
    }
  );

const AbbyHeader = () => (
  <Link href={"/"} className="text-4xl font-bold text-pink-400">
    A/BBY
  </Link>
);

const SideBar =
  // eslint-disable-next-line react/display-name
  forwardRef<
    HTMLDivElement,
    {
      mobileOnly?: boolean;
      currentProjectId: string;
      isLoading?: boolean;
      closeSidebar: () => void;
      projects: Array<{ id: string; name: string }>;
    }
  >(
    (
      { mobileOnly, closeSidebar, currentProjectId, isLoading, projects },
      ref
    ) => {
      const router = useRouter();

      const [isCreateProjectModal, setIsCreateProjectModal] = useState(false);
      const openCreateProjectModal = async () => {
        setIsCreateProjectModal(true);
      };

      const { update: sessionUpdate } = useSession();

      return (
        <aside
          ref={ref}
          className={clsx(
            mobileOnly ? "flex lg:hidden" : "hidden lg:flex",
            "fixed z-10 h-full flex-col justify-between bg-gray-900 p-10 text-pink-50 lg:relative lg:w-full"
          )}
        >
          {isCreateProjectModal && (
            <CreateProjectModal
              onClose={() => setIsCreateProjectModal(false)}
            />
          )}
          <nav className="flex flex-col gap-4">
            <AbbyHeader />
            <div className="relative mt-2">
              <Select
                items={projects.map((p) => ({ label: p.name, value: p.id }))}
                value={currentProjectId}
                isLoading={isLoading}
                onChange={async (projectId) => {
                  if (projectId === currentProjectId) return;
                  closeSidebar();

                  await sessionUpdate({
                    lastOpenProjectId: projectId,
                  });

                  router.push({
                    ...router,
                    query: { ...router.query, projectId },
                  });
                }}
              />
              <button
                className={
                  "mt-4 flex w-full items-center rounded-lg px-4 py-2 text-lg font-bold transition-colors duration-150 ease-in-out hover:bg-gray-600"
                }
                onClick={openCreateProjectModal}
              >
                <MdAdd className="mr-2" />
                Create new Project
              </button>
            </div>
            <hr className="mb-2 border-pink-50/20" />
            <Link
              href={`/projects/${currentProjectId}`}
              onClick={closeSidebar}
              className={navItemClass(
                router.pathname.endsWith("/projects/[projectId]")
              )}
            >
              <MdSpaceDashboard className="mr-2" />
              A/B Tests
            </Link>
            <Link
              href={`/projects/${currentProjectId}/flags`}
              onClick={closeSidebar}
              className={navItemClass(
                router.pathname.endsWith("/projects/[projectId]/flags")
              )}
            >
              <RiToggleLine className="mr-2" />
              Feature Flags
            </Link>
            <Link
              href={`/projects/${currentProjectId}/environments`}
              onClick={closeSidebar}
              className={navItemClass(
                router.pathname.endsWith("/projects/[projectId]/environments")
              )}
            >
              <FiServer className="mr-2" />
              Environments
            </Link>
            <Link
              href={`/projects/${currentProjectId}/settings`}
              onClick={closeSidebar}
              className={navItemClass(
                router.pathname.endsWith("/projects/[projectId]/settings")
              )}
            >
              <MdSettings className="mr-2" />
              Settings
            </Link>
          </nav>
          <div className="w-full">
            <UserInfo />
          </div>
        </aside>
      );
    }
  );

export const Layout = ({
  children,
  hideSidebar,
}: {
  children: ReactNode;
  hideSidebar?: boolean;
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const modalButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const currentProjectId = router.query.projectId as string;
  const { data, isLoading } = trpc.user.getProjects.useQuery();

  const currentProject = data?.projects.find(
    ({ project }) => project.id === currentProjectId
  );

  const closeSidebar = useCallback((e?: MouseEvent) => {
    if (e) {
      e.stopPropagation();
      if (e.currentTarget === modalButtonRef.current) return;
    }
    setIsSidebarOpen(false);
  }, []);

  return (
    <>
      <NextSeo title={currentProject?.project.name} />

      <div
        className={twMerge(
          "grid h-screen bg-gray-700",
          hideSidebar ? "flex" : "lg:grid-cols-[minmax(auto,320px),1fr]"
        )}
      >
        {!hideSidebar && (
          <>
            <SideBar
              closeSidebar={closeSidebar}
              mobileOnly={false}
              key="desktop"
              currentProjectId={currentProjectId}
              projects={(data?.projects ?? []).map((p) => p.project)}
              isLoading={isLoading}
            />

            <Transition show={isSidebarOpen}>
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
                unmount={false}
              >
                <SideBar
                  closeSidebar={closeSidebar}
                  mobileOnly
                  currentProjectId={currentProjectId}
                  projects={(data?.projects ?? []).map((p) => p.project)}
                  isLoading={isLoading}
                  key="mobile"
                />
              </Transition.Child>
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-500 sm:duration-700"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                unmount={false}
              >
                <div
                  className="fixed z-[9] h-screen w-screen bg-black/40"
                  onClick={closeSidebar}
                />
              </Transition.Child>
            </Transition>
          </>
        )}
        <main className="relative w-full overflow-y-auto overflow-x-hidden text-white">
          <div className="flex items-center justify-between bg-gray-800 px-8 py-3 lg:hidden">
            <AbbyHeader />
            <button
              ref={modalButtonRef}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-200 ease-in-out hover:bg-gray-700"
              onClick={() => {
                setIsSidebarOpen(true);
              }}
            >
              <GiHamburgerMenu />
            </button>
          </div>

          <div className="p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </>
  );
};
