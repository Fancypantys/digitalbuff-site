# TheWorkspace — Brand Assets

Drop-in logo system for TheWorkspace brand.

## Files in this bundle

| File | Purpose |
|---|---|
| `logo.svg` | Static wordmark (400×80). Use in footers, emails, docs. |
| `logo-animated.svg` | Same mark with a blinking cursor via `<animate>`. Use on web. |
| `favicon.svg` | Square `{tw}` mark for favicons, avatars, app icons. |
| `DigitalBuffLogo.jsx` | React component — most flexible option. |
| `brand-tokens.css` | CSS custom properties for the full palette + fonts. |
| `brand-tokens.json` | Same tokens, machine-readable. |

## Quick install (any framework)

1. Copy `brand-tokens.css` into your global stylesheet (or import it).
2. Add the JetBrains Mono font. In your `<head>`:
   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap" rel="stylesheet">
   ```
   …or self-host if you prefer no third-party calls.
3. Use the SVG directly, or the React component below.

## React usage

```jsx
import TheWorkspaceLogo from "./DigitalBuffLogo";

// Default: mint accent on dark, animated cursor
<TheWorkspaceLogo size={48} />

// Static (no blink)
<TheWorkspaceLogo size={32} animated={false} />

// Monochrome — inherits currentColor
<div style={{ color: "white" }}>
  <TheWorkspaceLogo variant="mono" size={40} />
</div>

// Inverse (on accent-colored backgrounds)
<div style={{ background: "#00d9a3", padding: 24 }}>
  <TheWorkspaceLogo variant="inverse" size={40} />
</div>

// Custom colors
<TheWorkspaceLogo color="#fff" accent="#ff5722" size={40} />
```

## Favicon setup

In your HTML `<head>`:
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
```

## Brand tokens (CSS variables)

```
--tw-bg:         #0a0a0b
--tw-surface:    #141416
--tw-border:     #262626
--tw-ink:        #f5f3ee
--tw-muted:      #8a8680
--tw-accent:     #00d9a3
--tw-accent-dim: #00a57b
```
