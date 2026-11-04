# Cheeta
This repository is a mobile-first monorepo project for a betting account aggregator. The goal is to let users sign in, connect multiple betting-site accounts, and manage or view them from a single application.

The architecture is modular. Multiple small apps or modules live in the same repo, with shared packages for UI components, state management, API clients, and shared models or types.

React Native is the recommended framework because it supports shared architecture and multiple app entry points while still delivering native mobile experiences.

For safety and maintainability, the mobile apps should rely on a backend boundary, use official integrations or approved methods for connecting to providers, and avoid handling credentials directly whenever possible.

The initial milestone is a small read-only test app, a dashboard that can link a provider, real or mock, and display unified account data to validate the architecture before adding advanced features.








