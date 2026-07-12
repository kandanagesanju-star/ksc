# Deployment and Release Rules for KSC POS System

Whenever any updates, bug fixes, or new features are introduced to this codebase, the agent MUST deploy the changes to **both** of the following environments:

1. **ksc-shop (ksc-6ie.pages.dev)**:
   - This environment has an active Git integration.
   - To deploy, commit the changes and push them to the main GitHub repository:
     ```bash
     git add .
     git commit -m "commit message"
     git push origin main
     ```

2. **ksc-saas-pos (ksc-saas-pos.pages.dev)**:
   - This environment does NOT have a Git connection.
   - To deploy, compile the production assets and run direct Wrangler deploy:
     ```bash
     npm run build
     npx wrangler pages deploy dist --project-name ksc-saas-pos
     ```

Ensure that both deployments succeed before concluding the task.
