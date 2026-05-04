import React from "react";

/**
 * TheWorkspace Logo Component
 *
 * Props:
 *   size      — height in pixels (default 40). Width scales automatically.
 *   animated  — whether the cursor blinks (default true)
 *   variant   — "default" (mint on dark), "mono" (single color), "inverse" (dark on mint)
 *   color     — override the main text color
 *   accent    — override the bracket/cursor color
 *   className — pass through for layout wrappers
 */
export function TheWorkspaceLogo({
  size = 40,
  animated = true,
  variant = "default",
  color,
  accent,
  className = "",
  ...rest
}) {
  const palette = {
    default: { text: "#f5f3ee", accent: "#00d9a3" },
    mono:    { text: "currentColor", accent: "currentColor" },
    inverse: { text: "#0a0a0b", accent: "#0a0a0b" },
  }[variant] ?? { text: "#f5f3ee", accent: "#00d9a3" };

  const textColor   = color  ?? palette.text;
  const accentColor = accent ?? palette.accent;

  // Native aspect ratio of the mark is 400 × 80 (5:1)
  const width = (size * 400) / 80;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 80"
      width={width}
      height={size}
      role="img"
      aria-label="TheWorkspace"
      className={className}
      {...rest}
    >
      <text
        x="10"
        y="56"
        fontFamily="'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fontSize="44"
        fontWeight="700"
        letterSpacing="-1.8"
      >
        <tspan fill={accentColor}>{"{"}</tspan>
        <tspan fill={textColor}>theworkspace</tspan>
        <tspan fill={accentColor}>{"}"}</tspan>
      </text>
      <rect x="372" y="26" width="14" height="34" fill={accentColor}>
        {animated && (
          <animate
            attributeName="opacity"
            values="1;1;0;0"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </rect>
    </svg>
  );
}

export default TheWorkspaceLogo;
