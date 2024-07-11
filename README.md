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
3. Install dependencies with Yarn:
   ```bash
   yarn install
   ```
4. Start the development server:
   ```bash
   yarn dev
   ```

## Folder Structure

Here is the updated folder structure, focusing on the `app` part and reducing the `ui` directory:

```
src
├── app
│   ├── __root.tsx
│   ├── app
│   │   ├── _editor.tsx
│   │   └── index.tsx
│   ├── globals.css
│   ├── home
│   │   ├── _front.tsx
│   │   └── index.tsx
│   └── index.tsx
├── assets
│   └── logo.svg
├── components
│   ├── layout
│   │   └── seo.tsx
│   └── ui
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── modal.tsx
│       ├── toast.tsx
│       └── ....tsx
├── lib
│   ├── consts.ts
│   └── utils.ts
├── main.tsx
├── queries
│   ├── errors.ts
│   ├── fetch-post.ts
│   └── fetch-posts.ts
└── routes.gen.ts
```

### Explanation:

#### `app` directory:

- **\_\_root.tsx**: Entry point for the app.
- **app/\_editor.tsx**: Editor layout for `/app` related routes.
- **app/index.tsx**: Main file for the `/app` route.
- **globals.css**: Global styles.
- **home/\_front.tsx**: Front page layout for the `/home` routes.
- **home/index.tsx**: Main file for the `/home` route.
- **index.tsx**: Main file for the `/` route (login).

#### `assets` directory:

- **logo.svg**: Logo asset.

#### `components` directory:

- **layout/seo.tsx**: SEO component.
- **ui/---.tsx**: Shadcn components.

ShadCN is a utility-first CSS framework that provides pre-built, customizable components for building modern web applications. The components stored in the ui directory are designed to be reusable and follow consistent design principles.

https://ui.shadcn.com/docs/components

#### `lib` directory:

- **consts.ts**: Constants.
- **utils.ts**: Utility functions.

#### `queries` directory:

- **errors.ts**: Error handling.
- **fetch-post.ts**: Fetch single post.
- **fetch-posts.ts**: Fetch multiple posts.

#### Other files:

- **main.tsx**: Main entry point for the application.
- **routes.gen.ts**: Generated routes file tanstack-router.

## Development Notes

- Ensure that the `node_modules` directory is properly ignored in your `.gitignore` to prevent version control bloating.
- Regularly update dependencies to mitigate potential security vulnerabilities and ensure compatibility with new features.
