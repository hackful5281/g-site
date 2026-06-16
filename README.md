# Garen's site

Vue3 + Vite personal tools site.

## Run

```bash
pnpm install
pnpm dev
```

## Structure

- `src/config/site.config.js`: site name, header menus, header actions, footer text.
- `src/tools/index.js`: central tool registry and group generator.
- `src/tools/<tool-id>/index.js`: one folder per tool. Add title, group, status, summary, cover, and accent here.
- `src/components`: shared layout components.
- `src/styles/base.css`: responsive layout and visual style.

## Add A Tool

1. Create `src/tools/my-tool/index.js`.
2. Export the tool metadata object.
3. Import it in `src/tools/index.js` and add it to the `tools` array.

The home page reads from the registry, so new tools appear automatically after registration.
