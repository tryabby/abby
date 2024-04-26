import { Menu, Transition } from '@headlessui/react'
import { DOCS_URL } from '@tryabby/core'
import clsx from 'clsx'
import Logo from 'components/Logo'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from 'components/ui/navigation-menu'

import { cn } from 'lib/utils'
import { ExternalLink, Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import * as React from 'react'
import { Fragment } from 'react'
import { GiHamburgerMenu } from 'react-icons/gi'
import { trpc } from 'utils/trpc'

type NavItem = {
  title: string
} & (
  | { href: string; isExternal?: boolean }
  | {
      subItems: {
        title: string
        subTitle: string
        href: string
        isExternal?: boolean
      }[]
    }
)

const NAV_ITEMS: Array<NavItem> = [
  {
    title: 'Features',
    href: '/#features',
  },
  {
    title: 'Pricing',
    href: '/#pricing',
  },
  {
    title: 'Developer',
    subItems: [
      {
        title: 'Devtools',
        subTitle: 'Painless Debugging',
        href: '/devtools',
      },
      {
        title: 'Integrations',
        subTitle: 'SDKs for React, Next.js, and More',
        href: '/integrations',
      },
      {
        title: 'Documentation',
        subTitle: 'Developers API Reference',
        href: DOCS_URL,
        isExternal: true,
      },
    ],
  },
  {
    title: 'Learn More',
    subItems: [
      {
        title: 'Tips & Insights',
        subTitle: 'Learn how to use Abby',
        href: '/tips-and-insights',
      },
      {
        title: 'Contact Us',
        subTitle: 'Get in touch with us',
        href: '/contact',
      },
    ],
  },
]

function MobileNav() {
  const { data, status } = useSession()

  return (
    <Menu>
      <Menu.Button
        aria-label='Open the navigation menu'
        className='flex h-12 w-12 items-center justify-center space-x-2 rounded-lg font-medium transition-colors duration-200 ease-in-out hover:bg-pink-300/40 lg:hidden'
      >
        <GiHamburgerMenu />
      </Menu.Button>
      <Transition
        enter='transition duration-100 ease-out'
        enterFrom='transform scale-95 opacity-0'
        enterTo='transform scale-100 opacity-100'
        leave='transition duration-75 ease-out'
        leaveFrom='transform scale-100 opacity-100'
        leaveTo='transform scale-95 opacity-0'
        as={Fragment}
      >
        <Menu.Items
          className={cn(
            'absolute right-6 top-[80px] z-10 flex w-[calc(100%-3rem)] flex-col space-y-4 rounded-lg p-4 shadow-xl',
            'border border-ab_accent-background bg-ab_primary-background text-ab_primary-foreground'
          )}
        >
          {NAV_ITEMS.flatMap((i) => ('subItems' in i ? i.subItems : i)).map(
            ({ href, title, isExternal }) => (
              <Menu.Item key={href}>
                {({ active }) => (
                  <Link
                    className={clsx(
                      'flex items-center space-x-2 rounded-lg p-2',
                      active && 'bg-ab_accent-background text-ab_accent-foreground'
                    )}
                    href={href ?? ''}
                  >
                    <span>{title}</span>
                    {isExternal && <ExternalLink className='-mt-1 h-4 w-4' />}
                  </Link>
                )}
              </Menu.Item>
            )
          )}
          <Menu.Item>
            {status === 'authenticated' ? (
              <NavItem
                href={`/projects${
                  data.user?.lastOpenProjectId ? `/${data.user?.lastOpenProjectId}` : ''
                }/flags`}
                isProminent
                className='mr-0'
              >
                Dashboard
              </NavItem>
            ) : (
              <NavItem isProminent href='/login' className='mr-0'>
                Log In
              </NavItem>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

type NavItemProps = {
  children: React.ReactNode
  isProminent?: boolean
  className?: string
} & (
  | {
      href: string
      onClick?: never
    }
  | {
      href?: never
      onClick: () => void
    }
)
function NavItem({ href, children, onClick, isProminent, className }: NavItemProps) {
  return (
    <Link
      href={href ?? ''}
      onClick={onClick}
      scroll={false}
      className={clsx(
        'mr-2 flex items-center space-x-2 rounded-lg px-4 py-2 font-medium transition-all duration-200 ease-in-out',
        className,
        isProminent
          ? 'bg-ab_accent-background text-ab_accent-foreground hover:opacity-90'
          : 'hover:bg-pink-300/40'
      )}
    >
      {children}
    </Link>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<typeof Link>,
  React.ComponentPropsWithoutRef<typeof Link> & {
    isExternalLink?: boolean
  }
>(({ className, title, children, isExternalLink, ...props }, ref) => {
  return (
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        className={cn(
          'block select-none space-y-1 rounded-md bg-ab_primary-background p-3 leading-none text-ab_primary-foreground no-underline outline-none transition-colors hover:bg-gray-800 hover:text-ab_primary-foreground focus:bg-gray-800 focus:text-ab_primary-foreground',
          className
        )}
        {...props}
      >
        <div className='flex items-center space-x-2 text-sm font-medium leading-none'>
          <span>{title}</span>{' '}
          {isExternalLink && <ExternalLink width={14} height={14} className='-mt-1' />}
        </div>
        <p className='line-clamp-2 text-sm leading-snug text-ab_primary-foreground-muted'>
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  )
})
ListItem.displayName = 'ListItem'

export function Navbar({ isInverted }: { isInverted?: boolean }) {
  const { data: userSession, status } = useSession()
  const { data: starsCount, isLoading: isStarsLoading } = trpc.misc.getStars.useQuery()

  return (
    <nav className='container relative flex items-center justify-between border-b border-b-ab_accent-background px-6 py-6 md:px-16'>
      <div className='flex items-center space-x-4'>
        <Link href='/' className='mr-12'>
          <Logo />
        </Link>

        <NavigationMenu className='hidden lg:block'>
          <NavigationMenuList>
            {NAV_ITEMS.map((item) => (
              <NavigationMenuItem key={item.title}>
                {!('subItems' in item) ? (
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink className='group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-ab_primary-background-hover hover:text-ab_primary-foreground focus:bg-ab_primary-background-hover focus:text-ab_primary-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-ab_primary-background-hover data-[state=open]:bg-ab_primary-background-hover'>
                      {item.title}
                    </NavigationMenuLink>
                  </Link>
                ) : (
                  <>
                    <NavigationMenuTrigger className='group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-ab_primary-background-hover hover:text-ab_primary-foreground focus:bg-ab_primary-background-hover focus:text-ab_primary-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-ab_primary-background-hover data-[state=open]:bg-ab_primary-background-hover'>
                      {item.title}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className='min-w-[400px]'>
                      {item.subItems.map(({ href, title, subTitle, isExternal }) => (
                        <ListItem key={href} href={href} title={title} isExternalLink={isExternal}>
                          {subTitle}
                        </ListItem>
                      ))}
                    </NavigationMenuContent>
                  </>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <div className='flex items-center space-x-3'>
        <Link
          href='https://github.com/tryabby/abby'
          className='flex h-full items-center justify-center space-x-2 rounded-lg border-2 border-ab_primary-foreground px-4 py-2 font-medium transition-colors duration-200 ease-out hover:bg-pink-300/50'
        >
          <Star className='h-5 w-5' />
          <span>{isStarsLoading ? '0' : `${starsCount}`}</span>
        </Link>
        {status === 'authenticated' ? (
          <NavItem
            href={`/projects${
              userSession.user?.lastOpenProjectId ? `/${userSession.user?.lastOpenProjectId}` : ''
            }/flags`}
            isProminent
            className='hidden lg:flex'
          >
            Dashboard
          </NavItem>
        ) : (
          <NavItem isProminent href='/login' className='hidden lg:flex'>
            Log In
          </NavItem>
        )}
        <MobileNav />
      </div>
    </nav>
  )
}
