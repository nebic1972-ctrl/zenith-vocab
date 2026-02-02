# Dependency Management

## Version Strategy

Dependencies are pinned to specific versions (using `^`) for stability. 

### Update Process

1. **Review changelogs** for breaking changes
2. **Test thoroughly** in development environment
3. **Update versions** incrementally
4. **Run full test suite** before committing

### Tools

- **npm-check-updates (ncu)**: Check for available updates
  ```bash
  npx npm-check-updates
  ```

- **npm outdated**: List outdated packages
  ```bash
  npm outdated
  ```

## Dependency Categories

### Core Framework
- `next`: Next.js framework
- `react`: React library
- `react-dom`: React DOM rendering

### UI & Styling
- `framer-motion`: Animations
- `lucide-react`: Icons
- `next-themes`: Theme management (dark mode)
- `tailwind-merge`: Tailwind class merging
- `class-variance-authority`: Component variants
- `clsx`: Conditional class names

### State Management
- `zustand`: Lightweight state management
- `@tanstack/react-query`: Server state management

### Data Visualization
- `recharts`: Chart library

## Notes

- All dependencies use caret (`^`) for minor/patch updates
- Major version updates require manual review
- Consider security updates via `npm audit`
