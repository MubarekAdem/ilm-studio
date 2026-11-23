# supabase.com: design rules

A light interface on a near-white neutral background where a green accent marks the next step. Type is Manrope, corners are 11px, and depth comes from soft neutral shadows.

## Principles

### Soft, neutral depth

Lift raised elements with the measured shadow (rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px 0px inset…).

_Why:_ Shadows appear on about 3% of elements; they mark what floats above the page and are never tinted.

### Big type, quiet body

Pair 46px headings in Manrope with 15px body text in Inter.

_Why:_ A 3.1× jump between headline and body creates strong hierarchy with few elements.

### A steady rhythm

Space everything on the 4px grid: 1, 4, 8, 12, 16, 20, 24, 32px.

_Why:_ 88% of measured spacing values fall on this grid, which is what makes the layout feel ordered.

### Consistent corners

Use 11px corners as the default radius.

_Why:_ It is the most common measured radius; one radius family is what makes separate components feel like one product.

## Never

- **Never tint shadows with colour.** Every measured shadow is neutral; a coloured glow would read as a different product.
- **Never introduce a second accent colour.** Only one saturated colour (#0e7e4e) carries weight in the measured palette.
- **Never set button labels in all capitals.** No measured button uses uppercase text.
- **Never use spacing off the 4px grid.** 88% of measured spacing sits on it.

## Colour

- Light theme: near-white neutral background (#fdfdfd) with #eeeeee surfaces.
- Body text #030303 on the background reads at 20.3:1; secondary text uses #696969.
- Accent #0e7e4e (green) with #ffffff text on top of it.

## Typography

- Manrope for headings, Inter for body.
- Scale: display 46px, h1 34px, h2 22px, h3 18px, h4 16px, body 15px, small 14px.
- Weights in use: 450, 500.

## Shape and depth

- Radii: 5px (15%), 8px (4%), 9px (3%), 11px (30%), 15px (3%), 16px (6%), 21px (9%), pill (29%).
- Borders: 1px in #e9e9e9.
- Shadows: rgba(0, 0, 0, 0.04) 0px 1px 3px 0px, rgba(0, 0, 0, 0.027) 0px 1px 0px… | rgba(255, 255, 255, 0.12) 0px 0px 0px 1px inset | oklab(0.999994 0.0000455678 0.0000200868 / 0.3) 0px 0px 0px 1px | rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rg…
