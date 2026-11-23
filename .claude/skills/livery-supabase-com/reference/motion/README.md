# How it moves, step by step

Every animation and behaviour found on the page, as recipes: what starts it, which element, which property from what to what, for how long, on which curve, in what order. Times are from the moment the trigger happens. Build them one at a time and check each against its film (frames captioned with their time, or with the scroll position).

Measured at 1440 px on supabase.com. Values in `code` are exactly as the browser reported them.

## The page's motion language

- **Curves:** `cubic-bezier(0.4, 0, 0.6, 1)` (9×), `linear` (5×), `ease` (2×).
- **Durations:** 300 ms, 600 ms, 30000 ms, 35000 ms.
- **Easing toward the scroll:** values chase their target by 0.294 of the remaining distance each frame (`current += (target - current) * 0.294` in a requestAnimationFrame loop), coming to rest about 876 ms after the scroll stops.

## When the page scrolls

### 1. Classes and attributes the scroll switches

- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` `opacity` `1` → `0`, 512 ms after the scroll.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(1)` `opacity` `1` → `0`, 512 ms after the scroll.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(1)` `opacity` `1` → `0`, 512 ms after the scroll.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(1)` `opacity` `1` → `0`, 512 ms after the scroll.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` `opacity` `0` → `1`, 512 ms after the scroll.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(1)` `opacity` `0` → `1`, 512 ms after the scroll.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(1)` `opacity` `0` → `1`, 512 ms after the scroll.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(2)` `opacity` `1` → `0`, 598 ms after the scroll.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(5) > div:nth-of-type(1)` `opacity` `1` → `0`, 598 ms after the scroll.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(1)` `opacity` `0` → `1`, 598 ms after the scroll.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`flex`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 10021 (`flex`: `nt"]}],"display":["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cel`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`flex`).

### 2. `div.mx-auto > div.relative.overflow-hidden > div.grid.grid-cols-2 > div.flex.flex-col > div` follows the scroll

- **What:** 15 elements like it change `transform` as the page scrolls.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(5) > div:nth-of-type(3)` `transform`: `scale(0.98)` → `none` over 19 frames, at rest 876 ms after the scroll; eases toward its target by 0.179 a frame.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(3)` `transform`: `scale(0.98)` → `none` over 18 frames, at rest 844 ms after the scroll; eases toward its target by 0.188 a frame.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(3)` `transform`: `scale(0.98)` → `none` over 16 frames, at rest 809 ms after the scroll; eases toward its target by 0.222 a frame.
- `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(3)` `transform`: `scale(0.98)` → `none` over 14 frames, at rest 776 ms after the scroll; eases toward its target by 0.232 a frame.
- **How:** keep the scroll position as a target and an eased copy (`eased += (target - eased) * 0.179` each frame); write the values above from the eased copy, so it glides on after the wheel stops.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`flex`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 10021 (`flex`: `nt"]}],"display":["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cel`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`flex`).

### 3. `div.grid.grid-cols-2 > div.flex.flex-col > div` follows the scroll

- **What:** 15 elements like it change `transform` as the page scrolls.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(5) > div:nth-of-type(3)` `transform`: `none` → `scale(0.98)` over 18 frames, at rest 844 ms after the scroll; eases toward its target by 0.186 a frame.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(3)` `transform`: `none` → `scale(0.98)` over 16 frames, at rest 809 ms after the scroll; eases toward its target by 0.216 a frame.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(3)` `transform`: `none` → `scale(0.98)` over 14 frames, at rest 776 ms after the scroll; eases toward its target by 0.221 a frame.
- `div.grid.grid-cols-2 > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(3)` `transform`: `none` → `scale(0.98)` over 12 frames, at rest 726 ms after the scroll; eases toward its target by 0.53 a frame.
- **How:** keep the scroll position as a target and an eased copy (`eased += (target - eased) * 0.186` each frame); write the values above from the eased copy, so it glides on after the wheel stops.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`flex`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 10021 (`flex`: `nt"]}],"display":["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cel`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`flex`).

## Moving scenes (filmed)

### 4. Scripted div: 108 moving parts (transform)

- **Film:** `reference/motion/films/01-scripted-community.jpg` (captions are ms).
- **Element:** `main#main > section#community:nth-of-type(7) > div.border-b.border-border > div.mx-auto > div.relative.overflow-hidden:nth-of-type(2)` in section `09-community`.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`relative`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11201 (`relative`: `"none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"},"full","au`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`relative`).

### 5. Loop: marquee-reverse

- **Film:** `reference/motion/films/02-loop-products.jpg` (captions are ms).
- **Element:** `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.z-0 > div.relative.h-full:nth-of-type(1)` in section `03-products`.
- **In the code:** `reference/scripts/02-4icgbaujh.js` line 2 (`absolute`); `reference/scripts/04-e4726ba1-f0091752bf71629f.js` at character 173723 (`absolute`: `{return t=t.ownerDocument.defaultView,{rect:e,abs:"absolute"===n.position||"fixed"===n.position,clip:"none"!==n.clipPath`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11190 (`absolute`: `,"contain","none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"}`).

### 6. Loop: marquee-reverse

- **Film:** `reference/motion/films/03-loop-products.jpg` (captions are ms).
- **Element:** `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.z-0 > div.relative.h-full:nth-of-type(2)` in section `03-products`.
- **In the code:** `reference/scripts/02-4icgbaujh.js` line 2 (`absolute`); `reference/scripts/04-e4726ba1-f0091752bf71629f.js` at character 173723 (`absolute`: `{return t=t.ownerDocument.defaultView,{rect:e,abs:"absolute"===n.position||"fixed"===n.position,clip:"none"!==n.clipPath`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11190 (`absolute`: `,"contain","none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"}`).

## Going from page to page

### 7. / → /pricing (the `Pricing` link)

- **How the address changes:** history.pushState, no page load: the script swaps the content itself (a client-side router).
- **Takes:** 446 ms from the click until the last change.
- **In order:**
  1. 425 ms: `div#radix-_r_22_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_22_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_24_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_24_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_26_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_26_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_28_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_28_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_2a_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_2a_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_2c_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_2c_` `animation-name` `(unset)` → `none`
  1. 425 ms: `div#radix-_r_2e_` `transition-duration` `(unset)` → `0s`
  1. 425 ms: `div#radix-_r_2e_` `animation-name` `(unset)` → `none`
- **Animations that ran:**
  - 0 ms: `nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center` CSS animation `fadeIn` on `opacity`, 300 ms after 300 ms, `ease` (opacity: 0 → 1)
- **Film:** `reference/motion/transitions/01-to-pricing.jpg` (frames from the click, captioned with ms).

## Hovering (what scripts do; CSS hover rules are in styles.css)

### 8. Hovering `div..absolute`

- **Text scramble:** `span > figure.absolute.inset-0 > div.absolute.inset-0 > span.ml-1.text-primary:nth-of-type(2) > span` runs `deplo` → `deploy` → `deplo` → `depl` → `dep` → `de` → `d` → `s` over 519 ms.
- 22779 ms: `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.will-change-transform` CSS transition on `transform`, 1000 ms, `ease-out` (transform: translate(-39.3457px, 8.22637px) translate(-50%, -50%) → translate(0px) translate(-50%, -50%))
- 23463 ms: `nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center` CSS animation `fadeIn` on `opacity`, 300 ms after 300 ms, `ease` (opacity: 0 → 1)
- 23761 ms: `section#products > div.section-container.relative > a.group.relative > div.p-px.bg-surface-75` CSS transition on `boxShadow`, 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` (boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px)
- **Film:** `reference/motion/hovers/01-div-absolute.jpg`.
- **In the code:** `reference/scripts/18-2542-6eba1bb96f908796.js` line 71 (`text-primary`).

### 9. Hovering `a.group.relative`

- **Text typewriter:** `span > figure.absolute.inset-0 > div.absolute.inset-0 > span.ml-1.text-primary:nth-of-type(2) > span` runs `serve` → `se` → `ser` → `serv` → `serve` over 178 ms.
- 26614 ms: `nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center` CSS animation `fadeIn` on `opacity`, 300 ms after 300 ms, `ease` (opacity: 0 → 1)
- 26914 ms: `section#products > div.section-container.relative > a.group.relative > div.p-px.bg-surface-75` CSS transition on `boxShadow`, 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` (boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px)
- **Film:** `reference/motion/hovers/02-a-group-relative.jpg`.
- **In the code:** `reference/scripts/18-2542-6eba1bb96f908796.js` line 71 (`text-primary`).

### 10. Hovering `div.flex.items-center`

- 496 ms: `section#community > div.border-b.border-border > div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1)` `data-motion-pop-id` set to `_r_6_`
- 499 ms: `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` `transform` `none` → `scale(0.98)` (24 steps)
- 603 ms: `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(1)` `transform` `none` → `scale(0.980111)` (23 steps)
- 603 ms: `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(1)` `transform` `none` → `scale(0.980366)` (23 steps)
- 603 ms: `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(1)` `transform` `none` → `scale(0.980729)` (23 steps)
- 614 ms: `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(2) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` `transform` `scale(0.98)` → `scale(0.998997)` (22 steps)
- 31977 ms: `nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center` CSS animation `fadeIn` on `opacity`, 300 ms after 300 ms, `ease` (opacity: 0 → 1)
- 32210 ms: `section#products > div.section-container.relative > a.group.relative > div.p-px.bg-surface-75` CSS transition on `boxShadow`, 150 ms, `cubic-bezier(0.4, 0, 0.2, 1)` (boxShadow: none → rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.1) 0px 2px 4px -2px)
- **Film:** `reference/motion/hovers/03-div-flex-items-center.jpg`.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`relative`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11201 (`relative`: `"none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"},"full","au`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`relative`).

## Following the pointer

### 11. `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(1)` answers to the pointer

- `transform` `translate(0px, 0px) translate(-50%, -50%)` → `translate(0px, 0px) translate(-50%, -50%)` over 12 frames, easing 0.166 a frame.
- **In the code:** `reference/scripts/02-4icgbaujh.js` line 2 (`absolute`); `reference/scripts/04-e4726ba1-f0091752bf71629f.js` at character 173723 (`absolute`: `{return t=t.ownerDocument.defaultView,{rect:e,abs:"absolute"===n.position||"fixed"===n.position,clip:"none"!==n.clipPath`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11190 (`absolute`: `,"contain","none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"}`).

### 12. `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(2)` answers to the pointer

- `transform` `translate(0px, 0px) translate(-50%, -50%)` → `translate(0px, 0px) translate(-50%, -50%)` over 12 frames, easing 0.06 a frame.
- **In the code:** `reference/scripts/02-4icgbaujh.js` line 2 (`absolute`); `reference/scripts/04-e4726ba1-f0091752bf71629f.js` at character 173723 (`absolute`: `{return t=t.ownerDocument.defaultView,{rect:e,abs:"absolute"===n.position||"fixed"===n.position,clip:"none"!==n.clipPath`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11190 (`absolute`: `,"contain","none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"}`).

### 13. `radialgradient#paint0_radial_484_53266` answers to the pointer

- `gradientTransform` `translate(121 -2.671875) rotate(56.4303) scale(132.019)` → `translate(25 147.328125) rotate(56.4303) scale(132.019)` over 12 frames, easing 0.056 a frame.

### 14. `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(3)` answers to the pointer

- `transform` `translate(0px, 0px) translate(-50%, -50%)` → `translate(220px, 213px) translate(-50%, -50%)` over 9 frames, easing 0.132 a frame.
- **In the code:** `reference/scripts/02-4icgbaujh.js` line 2 (`absolute`); `reference/scripts/04-e4726ba1-f0091752bf71629f.js` at character 173723 (`absolute`: `{return t=t.ownerDocument.defaultView,{rect:e,abs:"absolute"===n.position||"fixed"===n.position,clip:"none"!==n.clipPath`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 11190 (`absolute`: `,"contain","none"]}],"position":["static","fixed","absolute","relative","sticky"],"inset":[{"inset":[{"$v":"isFraction"}`).

### 15. `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` answers to the pointer

- `transform` `none` → `scale(0.98)` over 6 frames, easing 0.592 a frame.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`flex`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 10021 (`flex`: `nt"]}],"display":["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cel`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`flex`).

### 16. `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(1)` answers to the pointer

- `transform` `none` → `scale(0.98)` over 6 frames, easing 0.723 a frame.
- **In the code:** `reference/scripts/05-4310-97ce731b669ea910.js` line 40 (`flex`); `reference/scripts/10-3084-44e29b4359d64f1b.js` at character 10021 (`flex`: `nt"]}],"display":["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cel`); `reference/scripts/18-2542-6eba1bb96f908796.js` line 1 (`flex`).

## CSS animations (rules and @keyframes in styles.css)

- `div.sticky.top-0:nth-of-type(3) > nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center:nth-of-type(2)`: `fadeIn` 0.3s `ease`, delay 0.3s.
- `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.relative.h-full:nth-of-type(1)`: `marquee` 35s `linear` infinite.
- `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.relative.h-full:nth-of-type(2)`: `marquee` 35s `linear` infinite.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(1) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(1)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(1) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(2)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.2s.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(1) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(3)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.4s.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(2) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(1)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(2) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(2)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.2s.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(2) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(3)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.4s.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(3) > div.w-auto.h-auto > div.rounded-full.bg-brand-default:nth-of-type(1)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(3) > div.w-auto.h-auto > div.rounded-full.bg-brand-default:nth-of-type(2)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.2s.
- `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(3) > div.w-auto.h-auto > div.rounded-full.bg-brand-default:nth-of-type(3)`: `pulse` 0.6s `cubic-bezier(0.4, 0, 0.6, 1)` infinite, delay 0.4s.

## The page's own code

The scripts the page ran are in `reference/scripts/` (20 files), so you can read exactly how each effect is made. Don't paste them in whole: rebuild each effect in the project's own code, following the recipe and the source together.

Not tried: navigation: cdpSession.send: Target page, context or browser has been closed; menu: skipped, out of time; clicks: skipped, out of time.
