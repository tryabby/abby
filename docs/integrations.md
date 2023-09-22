# Abby Integration Checklist

## Philosophy

The number 1 priority for every integration is **Developer Experience (DX)**
This means the following:

- Everything is typesafe (if the language / framework allows this)
- There should be as few boilerplate as possible
- The code should be documented and verbose
- It should be so simple to use that you never need to open the docs after setting Abby up once

## Features

### Isomorphic (Client & Server)

- Retrieve the Value of a Feature Flag (typesafety: parameter should be typed and only the possible names from the config)
- Retrieve the current variant of the User for a given A/B Test (typesafety: parameter should be typed and only the possible names from the config, return value should also be only the potential values)

### Client

- By default Feature Flags & A/B Tests should be rendered on the client
- If possible there should be a central way of fetching the values from the Abby API
- If there is a central way (e.g. React Context) data should be consumed from there
- If not data needs to be fetched when consuming
- If possible (Next.js, Sveltekit) Feature Flags should be rendered on the Server (SEO)
