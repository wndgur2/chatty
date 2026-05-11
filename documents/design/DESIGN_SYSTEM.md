# Design system (Chatty)

Authoritative CSS tokens live in [`frontend/src/index.css`](../../frontend/src/index.css) (`@theme` + `@layer base`). This document is the agent-readable summary; change tokens in CSS first, then update this file.

## Color

| Role | Tailwind / usage | Source |
|------|------------------|--------|
| Brand primary | `brand-*` (e.g. `bg-brand-500`, `text-brand-700`) | `--color-brand-*` in `@theme` |
| Surfaces / neutrals | `surface-*`, `--bg-color`, `--text-color`, `--border-color` | `--color-surface-*`, `:root` vars |
| Accent (secondary emphasis) | `accent-*` | `--color-accent-*` |

Prefer brand for primary actions and links; surface for backgrounds and borders; accent sparingly for highlights.

## Typography

- **Font stack**: `ui-sans-serif, system-ui, …` (see `body` in `index.css`).
- **Scale**: Use Tailwind text utilities (`text-sm`, `text-base`, `text-lg`). No custom font-size tokens yet—add to `@theme` if introducing a named scale.

## Spacing and layout

- **App shell**: `html` / `body` / `#root` use `height: 100dvh` / `100%` with `overflow: hidden` for a fixed viewport chat layout.
- **Spacing**: Prefer Tailwind spacing scale (`p-4`, `gap-2`, etc.). Keep chat list and composer padding consistent with existing screens.

## Motion

- Prefer short transitions (`duration-150`–`duration-200`) for hover/focus.
- Avoid animating layout properties that affect scroll containers in the message list.

## Content (AI messages)

- AI markdown uses `@tailwindcss/typography` where applied—keep prose styles consistent with [`frontend/src/features/chatroom/components/AiMarkdownContent.tsx`](../../frontend/src/features/chatroom/components/AiMarkdownContent.tsx).

## Dark mode

- Not defined in theme yet. Do not assume dark tokens until `index.css` gains a dark variant.
