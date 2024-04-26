import { DOCS_URL } from '@tryabby/core'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from 'lib/utils'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SiAngular, SiNextdotjs, SiReact, SiSvelte } from 'react-icons/si'

export const INTEGRATIONS = [
  {
    name: 'Next.js',
    logo: <SiNextdotjs />,
    docsUrlSlug: 'nextjs',
    logoFill: '#fff',
    description: 'Feature Flags, Remote Config, and A/B Testing for Next.js',
    npmPackage: 'next',
    additionalFeatures: [
      'Server Side Rendering',
      'Incremental Static Regeneration',
      'Easy to use Hooks',
    ],
  },
  {
    name: 'React',
    logo: <SiReact />,
    docsUrlSlug: 'react',
    logoFill: '#61DAFB',
    description: 'Feature Flags, Remote Config, and A/B Testing for React',
    npmPackage: 'react',
    additionalFeatures: ['Easy to use Hooks'],
  },
  {
    name: 'Svelte',
    logo: <SiSvelte />,
    docsUrlSlug: 'svelte',
    logoFill: '#FF3E00',
    description: 'Feature Flags, Remote Config, and A/B Testing for Svelte & Sveltekit',
    npmPackage: 'svelte',
    additionalFeatures: ['Sveltekit Support'],
  },
  {
    name: 'Angular',
    logo: <SiAngular />,
    docsUrlSlug: 'angular',
    logoFill: '#DD0031',
    description: 'Feature Flags, Remote Config, and A/B Testing for Angular',
    npmPackage: 'angular',
  },
] satisfies Array<{
  name: string
  logo: React.ReactNode
  logoFill: string
  docsUrlSlug: string
  description: string
  npmPackage: string
  additionalFeatures?: Array<string>
}>

export const Integrations = () => {
  const [currentIntegrationIndex, setCurrentIntegrationIndex] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout>()
  const currentIntegration = INTEGRATIONS[currentIntegrationIndex]

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIntegrationIndex((index) => (index === INTEGRATIONS.length - 1 ? 0 : index + 1))
    }, 2000)

    return () => clearInterval(intervalRef.current)
  }, [])

  if (!currentIntegration) {
    return null
  }

  return (
    <div className='container px-6 md:px-16'>
      <div className='flex flex-col items-center justify-center space-x-3 text-center text-4xl font-bold md:flex-row md:items-start'>
        <h2>Feature Flags for </h2>
        <div className='relative w-32'>
          <AnimatePresence>
            {INTEGRATIONS.map(
              (integration, index) =>
                index === currentIntegrationIndex && (
                  <motion.p
                    className='absolute left-0 top-0'
                    key={index}
                    style={{ color: integration.logoFill }}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                  >
                    {integration.name}
                  </motion.p>
                )
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className='mx-auto my-24 flex max-w-md justify-between'>
        {INTEGRATIONS.map((integration, index) => (
          <div>
            <button
              onClick={() => {
                setCurrentIntegrationIndex(index)
                clearInterval(intervalRef.current)
              }}
              data-active={index === currentIntegrationIndex}
              className={cn(
                'cursor-pointer bg-none text-5xl opacity-50 grayscale transition-all duration-300 ease-in-out hover:opacity-100 hover:grayscale-0',
                'data-[active=true]:opacity-100 data-[active=true]:grayscale-0'
              )}
              style={{ color: integration.logoFill }}
            >
              {integration.logo}
            </button>
          </div>
        ))}
      </div>
      <div className='flex items-center'>
        <Link
          href={`${DOCS_URL}integrations/${currentIntegration.docsUrlSlug}`}
          className='mx-auto block min-w-[200px] rounded-lg bg-accent px-4 py-2 text-center font-semibold uppercase text-accent-foreground transition-transform duration-200 ease-in-out hover:scale-110'
        >
          {currentIntegration.name} Docs
        </Link>
      </div>
    </div>
  )
}
