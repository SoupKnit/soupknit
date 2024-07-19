### Client:

Client is based on vite + react + tailwindcss + shadcn
Routing is handled by tanstack-router

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
