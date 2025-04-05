# Project Documentation


## Introduction

This repository contains the source code for a web application built with React, utilizing Vite for the build toolchain and Tailwind CSS for styling. It integrates shadcn as the state management solution and uses the TanStack Router for routing.

## Technology Stack

- **React**: A JavaScript library for building user interfaces.
- **Vite**: A modern frontend build tool that provides a faster and leaner development experience.
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **Shadcn**: A lightweight state management library.
- **TanStack Router**: A flexible and efficient router for React.
- **TanStack Query**: A powerful and flexible querying library for React.
- **Fastify**: A fast and low overhead web framework for Node.js.
- **Zod**: A TypeScript-first schema declaration and validation library.
- **Supabase**: An open-source Postgres database with real-time capabilities and authentication.

## Setup

To get started with this project, you'll need to have Node.js installed on your system. This project uses Yarn as the package manager. To set up the project:

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd <project-name>
   ```
3. Install dependencies with PNPM:
   ```bash
   pnpm install
   ```
4. Install supabase cli
   ```bash
   brew install supabase/tap/supabase
   supabase login
   ```
6. Start the development server:
   ```bash
   pnpm dev
   ```

## Project Structure

```
├── README.md
├── client
│   ├── components.json
│   ├── fonts
│   │   ├── geist-mono
│   │   └── geist-sans
│   ├── index.html
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── postcss.config.js
│   ├── prettier.config.js
│   ├── public
│   │   ├── images
│   │   └── robots.txt
│   ├── src
│   │   ├── actions
│   │   ├── app
│   │   ├── assets
│   │   ├── components
│   │   ├── lib
│   │   ├── main.tsx
│   │   ├── queries
│   │   └── routes.gen.ts
│   ├── ssl
│   │   └── README.md
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── typings
│   │   ├── env.d.ts
│   │   ├── reset.d.ts
│   │   └── svg.d.ts
│   ├── vercel.json
│   └── vite.config.ts
├── install.sh
├── package.json
├── packages
│   ├── jupyter-lab-ext
│   │   ├── CHANGELOG.md
│   │   ├── LICENSE
│   │   ├── README.md
│   │   ├── RELEASE.md
│   │   ├── examples
│   │   ├── index.html
│   │   ├── install.json
│   │   ├── package.json
│   │   ├── pyproject.toml
│   │   ├── setup.py
│   │   ├── soupknit_jupyer_messagebus
│   │   ├── src
│   │   ├── style
│   │   └── tsconfig.json
│   ├── model
│   │   ├── build
│   │   ├── package.json
│   │   ├── src
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   └── shared-ui
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── server
    ├── README.md
    ├── dist
    │   ├── app.js
    │   ├── app.js.map
    │   ├── controller
    │   ├── index.js
    │   ├── index.js.map
    │   ├── router.js
    │   └── router.js.map
    ├── nodemon.json
    ├── package.json
    ├── pnpm-lock.yaml
    ├── src
    │   ├── app.ts
    │   ├── controller
    │   ├── index.ts
    │   └── router.ts
    ├── static
    │   └── index.html
    └── tsconfig.json
```

This project is organized into multiple directories, each serving a specific function in the application's architecture. We leverage `pnpm workspaces` to manage dependencies across these directories efficiently, promoting a clean and modular structure.

### Directory Layout

- `/client`: Contains all client-side code, assets, and configuration. This includes HTML entry points, TypeScript configurations, and React components.
  - `/dist`: Compiled and bundled assets ready for deployment.
  - `/node_modules`: Client-specific dependencies managed by `pnpm`.
- `/server`: Houses the Fastify server codebase, including all backend logic, controllers, and routing mechanisms.
  - `/dist`: Server-side compiled JavaScript files.
  - `/node_modules`: Server-specific dependencies.
- `/packages`: This directory contains shared resources and modular packages that can be used across the client and server.
  - `/model`: Contains common types and interfaces used throughout the project.
  - `/shared-ui`: UI components shared between different parts of the project.
  - `/jupyter-lab-ext`: Extensions and customizations specific to Jupyter Lab.

### pnpm Workspaces

The project utilizes `pnpm workspaces` to link packages and manage node dependencies efficiently across the workspace. This setup allows us to:

- Install node modules only once at the root, reducing duplication and speeding up installations.
- Seamlessly link packages within the workspace, simplifying the development of packages that depend on each other.
- Enforce consistent dependency versions across the entire project to avoid conflicts and reduce bugs.

Running modules separately

```bash
pnpm dev --filter client # Run only the client module
pnpm dev --filter server # Run only the server module

pnpm build --filter client # Build only the client module
# ...and so on
```
