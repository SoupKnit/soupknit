# Server Module

This documentation provides an overview of the server repository, its structure, and the purpose of various files and directories. This server is built using Fastify, a high-performance Node.js framework.

## Directory Structure

- `dist/`: Contains the compiled JavaScript files from the TypeScript source, enabling deployment and execution in production environments.
  - `app.js` and `app.js.map`: Main application logic compiled from `app.ts`.
  - `controller/`: Contains compiled controllers handling specific business logic.
    - `indexController.js`: Controls primarily landing or index operations.
    - `userController.js`: Manages user-related operations.
  - `index.js` and `index.js.map`: Entry point for the server application.
  - `router.js` and `router.js.map`: Router configurations linking controllers to their respective routes.
- `node_modules/`: Project dependencies installed and managed by `pnpm`. Links are created to shared dependencies in the workspace to avoid duplication.
- `src/`: Source files written in TypeScript.
  - `app.ts`: Bootstrap and setup the main server application, integrating middleware and routers.
  - `controller/`: TypeScript files defining logic for handling requests.
    - `indexController.ts`: Handles requests to the main or index routes.
    - `userController.ts`: Processes requests related to users.
  - `index.ts`: Entry script that starts the server.
  - `router.ts`: Defines URL routes and their corresponding controllers.
- `static/`: Static files served directly by the server.
  - `index.html`: A basic HTML file that can be served as a landing page.
- `tsconfig.json`: Configuration file for TypeScript compiler options.

## Configuration Files

- `nodemon.json`: Configuration for Nodemon, a utility that monitors for any changes in your source and automatically restarts your server.
- `package.json`: Defines project dependencies and metadata. Contains scripts for starting the server, compiling TypeScript, and more.
- `pnpm-lock.yaml`: Auto-generated file to lock down the versions of dependencies installed, ensuring consistency across installations.
