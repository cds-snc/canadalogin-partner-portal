# GC Design System — Design Tokens Reference

Tokens are CSS custom properties following the naming convention `--gcds-{category}-{role}-{state}-{property}`.

**Three token types:**
- **Component tokens** — component-specific (e.g. `--gcds-button-primary-default-background`). Do not use outside their component.
- **Global tokens** — semantic, safe for general use (e.g. `--gcds-text-primary`).
- **Base tokens** — non-semantic colour palette, use when no global token fits (e.g. `--gcds-color-blue-500`).

Full docs: https://design-system.canada.ca/en/styles/design-tokens/

---

## 1. GLOBAL COLOUR TOKENS

### Text
| Token | Hex | Use on |
|---|---|---|
| `--gcds-text-light` | `#ffffff` | Background shade 700+ (e.g. `--gcds-bg-dark`) |
| `--gcds-text-primary` | `#333333` | Background shade 50 or lighter (e.g. `--gcds-bg-white`) |
| `--gcds-text-secondary` | `#595959` | Background shade 50 or lighter |

### Link
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-link-default` | `#1f497a` | Default link on white bg |
| `--gcds-link-hover` | `#1354ec` | Hover link on white bg |
| `--gcds-link-light` | `#ffffff` | Link on 700+ shade bg |
| `--gcds-link-visited` | `#4b248f` | Visited link on white bg |

### Background
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-bg-dark` | `#333333` | Dark bg, use with text shade 100 or lighter |
| `--gcds-bg-light` | `#f2f2f2` | Light bg (alt to white) |
| `--gcds-bg-primary` | `#26374a` | GC navy highlight, use with text shade 100 or lighter |
| `--gcds-bg-white` | `#ffffff` | Main bg |

### Border
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-border-default` | `#8c8c8c` | Default borders and icons on white bg |

### Danger / Error
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-danger-background` | `#b3192e` | Destructive action bg |
| `--gcds-danger-border` | `#b3192e` | Destructive border on white bg |
| `--gcds-danger-text` | `#b3192e` | Destructive text on white bg |

### Disabled
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-disabled-background` | `#d9d9d9` | Disabled interactive element bg |
| `--gcds-disabled-text` | `#808080` | Disabled interactive element text |

### Focus
| Token | Hex | Purpose |
|---|---|---|
| `--gcds-focus-background` | `#1354ec` | Focus bg for interactive elements |
| `--gcds-focus-border` | `#1354ec` | Focus border for interactive elements |
| `--gcds-focus-text` | `#ffffff` | Focus text colour |

---

## 2. BASE COLOUR TOKENS

Non-semantic palette. Use only when no global token fits your purpose.

### Blue
| Token | Hex |
|---|---|
| `--gcds-color-blue-50` | `#ebf2fa` |
| `--gcds-color-blue-100` | `#d6e4f5` |
| `--gcds-color-blue-150` | `#c2d7f0` |
| `--gcds-color-blue-200` | `#adcaeb` |
| `--gcds-color-blue-250` | `#99bde6` |
| `--gcds-color-blue-300` | `#85afe0` |
| `--gcds-color-blue-350` | `#70a2db` |
| `--gcds-color-blue-400` | `#5c95d6` |
| `--gcds-color-blue-450` | `#4788d1` |
| `--gcds-color-blue-500` | `#337acc` |
| `--gcds-color-blue-550` | `#2e6eb8` |
| `--gcds-color-blue-600` | `#2962a3` |
| `--gcds-color-blue-650` | `#24568f` |
| `--gcds-color-blue-700` | `#1f497a` |
| `--gcds-color-blue-750` | `#193d66` |
| `--gcds-color-blue-800` | `#143152` |
| `--gcds-color-blue-850` | `#0f253d` |
| `--gcds-color-blue-900` | `#0a1829` |
| `--gcds-color-blue-muted` | `#26374a` |
| `--gcds-color-blue-vivid` | `#1354ec` |

### Grayscale
| Token | Hex |
|---|---|
| `--gcds-color-grayscale-50` | `#f2f2f2` |
| `--gcds-color-grayscale-100` | `#e6e6e6` |
| `--gcds-color-grayscale-150` | `#d9d9d9` |
| `--gcds-color-grayscale-200` | `#cccccc` |
| `--gcds-color-grayscale-250` | `#bfbfbf` |
| `--gcds-color-grayscale-300` | `#b3b3b3` |
| `--gcds-color-grayscale-350` | `#a6a6a6` |
| `--gcds-color-grayscale-400` | `#999999` |
| `--gcds-color-grayscale-450` | `#8c8c8c` |
| `--gcds-color-grayscale-500` | `#808080` |
| `--gcds-color-grayscale-550` | `#737373` |
| `--gcds-color-grayscale-600` | `#666666` |
| `--gcds-color-grayscale-650` | `#595959` |
| `--gcds-color-grayscale-700` | `#4d4d4d` |
| `--gcds-color-grayscale-750` | `#404040` |
| `--gcds-color-grayscale-800` | `#333333` |
| `--gcds-color-grayscale-850` | `#262626` |
| `--gcds-color-grayscale-900` | `#1a1a1a` |

### Green
| Token | Hex |
|---|---|
| `--gcds-color-green-50` | `#ebfaf0` |
| `--gcds-color-green-100` | `#d6f5e1` |
| `--gcds-color-green-150` | `#c2f0d3` |
| `--gcds-color-green-200` | `#adebc4` |
| `--gcds-color-green-250` | `#99e6b5` |
| `--gcds-color-green-300` | `#85e0a6` |
| `--gcds-color-green-350` | `#70db97` |
| `--gcds-color-green-400` | `#5cd689` |
| `--gcds-color-green-450` | `#47d17a` |
| `--gcds-color-green-500` | `#33cc6b` |
| `--gcds-color-green-550` | `#2eb860` |
| `--gcds-color-green-600` | `#29a356` |
| `--gcds-color-green-650` | `#248f4b` |
| `--gcds-color-green-700` | `#1f7a40` |
| `--gcds-color-green-750` | `#196636` |
| `--gcds-color-green-800` | `#14522b` |
| `--gcds-color-green-850` | `#0f3d20` |
| `--gcds-color-green-900` | `#0a2915` |

### Purple
| Token | Hex |
|---|---|
| `--gcds-color-purple-50` | `#f0ebfa` |
| `--gcds-color-purple-100` | `#e1d6f5` |
| `--gcds-color-purple-150` | `#d3c2f0` |
| `--gcds-color-purple-200` | `#c4adeb` |
| `--gcds-color-purple-250` | `#b599e6` |
| `--gcds-color-purple-300` | `#a685e0` |
| `--gcds-color-purple-350` | `#9770db` |
| `--gcds-color-purple-400` | `#895cd6` |
| `--gcds-color-purple-450` | `#7a47d1` |
| `--gcds-color-purple-500` | `#6b33cc` |
| `--gcds-color-purple-550` | `#602eb8` |
| `--gcds-color-purple-600` | `#5629a3` |
| `--gcds-color-purple-650` | `#4b248f` |
| `--gcds-color-purple-700` | `#401f7a` |
| `--gcds-color-purple-750` | `#361966` |
| `--gcds-color-purple-800` | `#2b1452` |
| `--gcds-color-purple-850` | `#200f3d` |
| `--gcds-color-purple-900` | `#150a29` |

### Red
| Token | Hex |
|---|---|
| `--gcds-color-red-50` | `#fce9eb` |
| `--gcds-color-red-100` | `#f9d2d7` |
| `--gcds-color-red-150` | `#f5bcc4` |
| `--gcds-color-red-200` | `#f2a6b0` |
| `--gcds-color-red-250` | `#ef8f9c` |
| `--gcds-color-red-300` | `#ec7988` |
| `--gcds-color-red-350` | `#e96375` |
| `--gcds-color-red-400` | `#e64d61` |
| `--gcds-color-red-450` | `#e2364d` |
| `--gcds-color-red-500` | `#df2039` |
| `--gcds-color-red-550` | `#c91d34` |
| `--gcds-color-red-600` | `#b3192e` |
| `--gcds-color-red-650` | `#9c1628` |
| `--gcds-color-red-700` | `#861322` |
| `--gcds-color-red-750` | `#70101d` |
| `--gcds-color-red-800` | `#590d17` |
| `--gcds-color-red-850` | `#430a11` |
| `--gcds-color-red-900` | `#2d060b` |

### Yellow
| Token | Hex |
|---|---|
| `--gcds-color-yellow-50` | `#fef7e7` |
| `--gcds-color-yellow-100` | `#fcefcf` |
| `--gcds-color-yellow-150` | `#fbe7b6` |
| `--gcds-color-yellow-200` | `#fade9e` |
| `--gcds-color-yellow-250` | `#f9d686` |
| `--gcds-color-yellow-300` | `#f7ce6e` |
| `--gcds-color-yellow-350` | `#f6c655` |
| `--gcds-color-yellow-400` | `#f5be3d` |
| `--gcds-color-yellow-450` | `#f4b625` |
| `--gcds-color-yellow-500` | `#f2ad0d` |
| `--gcds-color-yellow-550` | `#da9c0b` |
| `--gcds-color-yellow-600` | `#c28b0a` |
| `--gcds-color-yellow-650` | `#aa7909` |
| `--gcds-color-yellow-700` | `#916808` |
| `--gcds-color-yellow-750` | `#795706` |
| `--gcds-color-yellow-800` | `#614505` |
| `--gcds-color-yellow-850` | `#493404` |
| `--gcds-color-yellow-900` | `#302303` |

### Named colours
| Token | Hex |
|---|---|
| `--gcds-color-black` | `#000000` |
| `--gcds-color-white` | `#ffffff` |

> **Note:** Token names use American spelling (color, grayscale). CSS property `color` also uses American spelling.

---

## 3. SPACING TOKENS

Based on vertical rhythm with a base of 1.25rem (20px). Use `--gcds-spacing-{N}` where N is the token scale.

| Token | Pixels | Rem |
|---|---|---|
| `--gcds-spacing-0` | 0px | 0rem |
| `--gcds-spacing-25` | 2px | 0.125rem |
| `--gcds-spacing-50` | 4px | 0.25rem |
| `--gcds-spacing-75` | 6px | 0.375rem |
| `--gcds-spacing-100` | 8px | 0.5rem |
| `--gcds-spacing-125` | 10px | 0.625rem |
| `--gcds-spacing-150` | 12px | 0.75rem |
| `--gcds-spacing-175` | 14px | 0.875rem |
| `--gcds-spacing-200` | 16px | 1rem |
| `--gcds-spacing-225` | 18px | 1.125rem |
| `--gcds-spacing-250` | 20px | 1.25rem |
| `--gcds-spacing-300` | 24px | 1.5rem |
| `--gcds-spacing-350` | 28px | 1.75rem |
| `--gcds-spacing-400` | 32px | 2rem |
| `--gcds-spacing-450` | 36px | 2.25rem |
| `--gcds-spacing-500` | 40px | 2.5rem |
| `--gcds-spacing-550` | 44px | 2.75rem |
| `--gcds-spacing-600` | 48px | 3rem |
| `--gcds-spacing-650` | 52px | 3.25rem |
| `--gcds-spacing-700` | 56px | 3.5rem |
| `--gcds-spacing-750` | 60px | 3.75rem |
| `--gcds-spacing-800` | 64px | 4rem |
| `--gcds-spacing-850` | 68px | 4.25rem |
| `--gcds-spacing-900` | 72px | 4.5rem |
| `--gcds-spacing-950` | 76px | 4.75rem |
| `--gcds-spacing-1000` | 80px | 5rem |
| `--gcds-spacing-1050` | 84px | 5.25rem |
| `--gcds-spacing-1100` | 88px | 5.5rem |
| `--gcds-spacing-1150` | 92px | 5.75rem |
| `--gcds-spacing-1200` | 96px | 6rem |
| `--gcds-spacing-1250` | 100px | 6.25rem |

**Commonly used:** `spacing-400` (32px) for standard component spacing, `spacing-200` (16px) for tight spacing, `spacing-600` (48px) for section spacing.

---

## 4. TYPOGRAPHY TOKENS

### Font Families
| Token | Value |
|---|---|
| `--gcds-font-families-heading` | `'Lato', sans-serif` |
| `--gcds-font-families-body` | `'Noto Sans', sans-serif` |
| `--gcds-font-families-monospace` | `'Noto Sans Mono', monospace` |
| `--gcds-font-families-icons` | `'gcds-icons'` |

### Font Weights
| Token | Value | Name |
|---|---|---|
| `--gcds-font-weights-light` | `300` | Light |
| `--gcds-font-weights-regular` | `400` | Regular |
| `--gcds-font-weights-medium` | `500` | Medium |
| `--gcds-font-weights-semibold` | `600` | Semibold |
| `--gcds-font-weights-bold` | `700` | Bold |

### Heading Typography (shorthand)

Headings use Lato, weight 700. The `--gcds-font-hN` token is a CSS `font` shorthand:

| Token | Shorthand value |
|---|---|
| `--gcds-font-h1` | `700 2.56rem/117% 'Lato', sans-serif` |
| `--gcds-font-h2` | `700 2.44rem/123% 'Lato', sans-serif` |
| `--gcds-font-h3` | `700 1.81rem/137% 'Lato', sans-serif` |
| `--gcds-font-h4` | `700 1.69rem/133% 'Lato', sans-serif` |
| `--gcds-font-h5` | `700 1.5rem/133% 'Lato', sans-serif` |
| `--gcds-font-h6` | `700 1.38rem/145% 'Lato', sans-serif` |

### Body Typography

| Token | Shorthand value |
|---|---|
| `--gcds-font-text` | `400 1.25rem/160% 'Noto Sans', sans-serif` |
| `--gcds-font-text-small` | `400 1.13rem/155% 'Noto Sans', sans-serif` |
| `--gcds-text-character-limit` | `65ch` (recommended max-width for readable text) |

---

## 5. TOKEN USAGE GUIDELINES

### ✅ DO
- Use **global tokens** for all custom CSS — they are semantic and stable
- Use **component tokens** only within their own component
- Combine global tokens with CSS Shortcuts utility classes for rapid development
- Check WCAG AA contrast (4.5:1 for text) when using base tokens

### ❌ DON'T
- Don't hardcode hex values — always use `var(--gcds-*)` tokens
- Don't use component tokens (e.g. `--gcds-button-*`) outside that component — they change with component updates
- Don't use base tokens when a global token exists — base tokens are non-semantic and harder to maintain

### Quick Reference — Most Common Tokens
```css
/* Text */
color: var(--gcds-text-primary);     /* #333333 — main body text */
color: var(--gcds-text-light);       /* #ffffff — on dark bg */

/* Links */
color: var(--gcds-link-default);     /* #1f497a — default link */

/* Backgrounds */
background: var(--gcds-bg-primary);  /* #26374a — GC navy */
background: var(--gcds-bg-light);    /* #f2f2f2 */
background: var(--gcds-bg-white);    /* #ffffff */

/* Spacing */
padding: var(--gcds-spacing-400);    /* 32px — standard */
margin-bottom: var(--gcds-spacing-200); /* 16px */

/* Typography */
font: var(--gcds-font-h2);           /* H2 style */
font-family: var(--gcds-font-families-body); /* Noto Sans */
```
