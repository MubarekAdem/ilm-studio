# Motion and Interactions

Considered transitions, with signature motion that carries the personality: rotating list, endless rail.

- Default to 400ms transitions (92% of measured ones).
- Ease with ease.
- Animate opacity, background-color, border-color, color; avoid animating layout.
- Stagger repeated items: rotating list starts each one 200ms after the last.
- Looping motion is slow and steady (several seconds per cycle), never frantic.
- Turn every loop and decorative animation off under prefers-reduced-motion, as the site does.

## Signature motion

The animations that make this site feel like itself. Recreate the behaviour with your own elements and content; the keyframes are the measured reference.

### Rotating list

9 items take turns: each fades and rises in, holds, then leaves, looping every 600ms, staggered 200ms apart. It runs on its own, on list items.

```css
@keyframes pulse { 0% { opacity: 1; animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); } 50% { opacity: 0.5; animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); } 100% { opacity: 1; animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); } }
.pulse { animation: pulse 600ms cubic-bezier(0.4, 0, 0.6, 1) infinite; /* + 200ms delay per item */ }
```

### Endless rail

A strip scrolls sideways forever, one pass every 30s, linear. It runs on its own, on blocks.

```css
@keyframes marquee-reverse { 0% { transform: translate(-100%); } 100% { transform: translate(0px); } }
.marquee-reverse { animation: marquee-reverse 30000ms linear infinite; }
```

### Entrance

Arrives with a fade over 300ms. It starts when its state changes (opened, selected, shown), on blocks.

```css
@keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
.fadeIn { animation: fadeIn 300ms ease both; }
```

## Interactions

- **Hover** changes background (67% of hover rules), background colour (67% of hover rules), border (67% of hover rules), opacity (33% of hover rules). Things rarely move on hover; they change colour.
- **Illustrations** are line art: thin strokes that stay thin at any size (vector-effect: non-scaling-stroke) on flat fills. Highlight a part by brightening its stroke, not by adding colour.

Animations started by people or state:

- `fadeIn`: enter, 300ms ease, starts when its state changes (opened, selected, shown).
- `swipe-out-left`: enter, 0ms ease, starts when its state changes (opened, selected, shown).
- `swipe-out-right`: enter, 0ms ease, starts when its state changes (opened, selected, shown).
- `swipe-out-up`: enter, 0ms ease, starts when its state changes (opened, selected, shown).
- `swipe-out-down`: enter, 0ms ease, starts when its state changes (opened, selected, shown).
- `slideFromBottom`: enter, 0ms ease, starts when its state changes (opened, selected, shown).

## Measurements

- Durations: 400ms (92%), 150ms (4%), 600ms (2%), 200ms (1%), 300ms (0%)
- Easings: `ease`, `cubic-bezier(0.4, 0, 0.2, 1)`, `cubic-bezier(0.22, 1, 0.36, 1)`, `cubic-bezier(0, 0, 0.2, 1)`
- Animated properties: opacity, background-color, border-color, color, outline-color, text-decoration-color, fill, stroke

The site turns its motion off under `prefers-reduced-motion: reduce`. Do the same: every looping or decorative animation stops, and state changes happen instantly.
