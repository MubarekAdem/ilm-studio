# Walkthrough: how the page is built and how it moves

One part per top-level section, top to bottom, as measured at 1440 px. Sizes are CSS pixels; colours are as computed. Every file named here is in this folder. How things move and behave (scrolling, page changes, the menu, hovers, clicks), step by step, is in `reference/motion/README.md`.

## 01 · nav

- **Box:** 1440×65 px, starting 0 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 2, gap normal, space-between/normal.
- **Type:** Inter 450 12px/16.5px · Inter 450 14px/20px · Inter 450 14px/19.25px · Manrope 600 14px/17.5px · Inter 500 12px/16px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 41 paragraphs, 10 buttons, 38 links, 1 picture, 42 drawings.
- **Look:** `reference/sections/01-nav.jpg` and its anatomy `reference/sections/01-nav.anatomy.jpg`.
- **Markup:** `reference/sections/01-nav.html`.
- **Drawings:** `reference/assets/svg/001-logo-supabase-logo.svg` (logo, 124×24), `reference/assets/svg/002-icon-nav.svg` (icon, 12×12, ×3), `reference/assets/svg/003-icon-nav.svg` (icon, 19×19), `reference/assets/svg/004-icon-nav.svg` (icon, 12×12, ×10), `reference/assets/svg/005-icon-nav.svg` (icon, 19×19), `reference/assets/svg/006-icon-nav.svg` (icon, 19×19), `reference/assets/svg/007-icon-nav.svg` (icon, 19×19), `reference/assets/svg/008-icon-nav.svg` (icon, 19×19), `reference/assets/svg/009-icon-nav.svg` (icon, 19×19), `reference/assets/svg/010-icon-nav.svg` (icon, 19×19), `reference/assets/svg/011-icon-nav.svg` (icon, 19×19), `reference/assets/svg/012-icon-nav.svg` (icon, 19×19), and 4 more.
- **Motion:**
  - CSS `fadeIn` 0.3s ease ×1 on 1 element (e.g. `div.sticky.top-0:nth-of-type(3) > nav.relative.z-40 > div.section-container.relative > div.flex.items-center > div.flex.items-center:nth-of-type(2)`)
- **Control states:** `reference/components/01-button.jpg` (button button.group.relative: rest, hover, focus).
- **Control states:** `reference/components/02-button.jpg` (button button.group.relative: rest, hover, focus).
- **Control states:** `reference/components/03-nav-link.jpg` (nav-link a.flex.items-center: rest, hover, focus).

## 02 · header

- **Box:** 1440×386 px, starting 65 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** grid, 2 columns (536px 536px), gap 16px.
- **Type:** Inter 450 16px/24px · Manrope 500 46px/46px · Inter 500 14px/20px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 1 paragraph, 1 button, 2 links.
- **Look:** `reference/sections/02-header.jpg` and its anatomy `reference/sections/02-header.anatomy.jpg`.
- **Markup:** `reference/sections/02-header.html`.

## 03 · products

- **Box:** 1440×949 px, starting 451 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** grid, 12 columns (79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px 79.6562px), gap 12px.
- **Type:** Inter 450 14px/20px · Inter 450 22px/29.3333px · Manrope 600 16px/24px · Inter 450 12px/16px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 8 paragraphs, 7 links, 20 pictures, 76 drawings.
- **Look:** `reference/sections/03-products.jpg` and its anatomy `reference/sections/03-products.anatomy.jpg`.
- **Markup:** `reference/sections/03-products.html`.
- **Drawings:** `reference/assets/svg/017-icon-products.svg` (icon, 18×18), `reference/assets/svg/018-icon-products.svg` (icon, 16×16, ×3), `reference/assets/svg/019-illustration-products.svg` (illustration, 256×398), `reference/assets/svg/020-icon-products.svg` (icon, 18×18), `reference/assets/svg/021-icon-products.svg` (icon, 18×18), `reference/assets/svg/022-icon-products.svg` (icon, 18×18), `reference/assets/svg/023-icon-products.svg` (icon, 24×24, ×20), `reference/assets/svg/024-icon-products.svg` (icon, 24×24, ×20), `reference/assets/svg/025-icon-products.svg` (icon, 24×24, ×20), `reference/assets/svg/026-icon-products.svg` (icon, 18×18), `reference/assets/svg/027-icon-products.svg` (icon, 30×38), `reference/assets/svg/028-icon-products.svg` (icon, 16×22), and 5 more.
- **Pictures:** `reference/assets/images/024-auth.svg`, `reference/assets/images/025-auth-active.svg`, `reference/assets/images/026-auth-light.svg`, `reference/assets/images/027-auth-active-light.svg`, `reference/assets/images/028-edge-functions-dark.svg`, `reference/assets/images/029-edge-functions-light.svg`, `reference/assets/images/030-realtime-dark.svg`, `reference/assets/images/031-realtime-light.svg`, `reference/assets/images/032-vector-dark.svg`, `reference/assets/images/033-vector-light.svg`.
- **Motion:**
  - CSS `marquee` 35s linear infinite on 2 elements (e.g. `div.p-px.bg-surface-75 > div.z-10.relative > span > figure.absolute.inset-0 > div.relative.h-full:nth-of-type(1)`)
  - CSS `pulse` 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite on 9 elements (e.g. `span > figure.absolute.inset-0 > div.absolute.will-change-transform:nth-of-type(1) > div.absolute.left-full > div.rounded-full.bg-foreground-lighter:nth-of-type(1)`, staggered: 0s, 0.2s, 0.4s)
  - CSS `marquee-reverse` 30s linear infinite on 3 elements (e.g. `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.z-0 > div.relative.h-full:nth-of-type(1)`)
- **Film:** `reference/motion/films/02-loop-products.jpg` (Loop: marquee-reverse; it is `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.z-0 > div.relative.h-full:nth-of-type(1)` in the markup; frames captioned with ms).
- **Film:** `reference/motion/films/03-loop-products.jpg` (Loop: marquee-reverse; it is `div.z-10.relative > span > figure.absolute.inset-0 > div.absolute.z-0 > div.relative.h-full:nth-of-type(2)` in the markup; frames captioned with ms).

## 04 · social-proof

- **Box:** 1440×270 px, starting 1400 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** grid, 6 columns (161px 161px 161px 161px 161px 161px), gap 40px 24px.
- **Type:** Inter 450 14px/20px (family weight size/line-height, most text first).
- **Inside:** 1 paragraph, 12 drawings.
- **Look:** `reference/sections/04-social-proof.jpg` and its anatomy `reference/sections/04-social-proof.anatomy.jpg`.
- **Markup:** `reference/sections/04-social-proof.html`.
- **Drawings:** `reference/assets/svg/034-illustration-lovable.svg` (illustration, 161×48), `reference/assets/svg/035-decoration-mozilla.svg` (decoration, 91×48), `reference/assets/svg/036-illustration-pwc.svg` (illustration, 90×48), `reference/assets/svg/037-illustration-figma.svg` (illustration, 133×48), `reference/assets/svg/038-decoration-v0.svg` (decoration, 81×48), `reference/assets/svg/039-illustration-bolt.svg` (illustration, 91×48), `reference/assets/svg/040-decoration-github.svg` (decoration, 108×48), `reference/assets/svg/041-decoration-betashares.svg` (decoration, 119×48), `reference/assets/svg/042-decoration-mobbin.svg` (decoration, 107×48), `reference/assets/svg/043-decoration-resend.svg` (decoration, 80×48), `reference/assets/svg/044-illustration-langchain.svg` (illustration, 131×48), `reference/assets/svg/045-decoration-1password.svg` (decoration, 114×48).

## 05 · dashboard

- **Box:** 1440×862 px, starting 1670 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 3, gap 8px, normal/normal.
- **Type:** Manrope 600 34px/37.7778px · Inter 450 14px/20px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 3 buttons, 2 pictures.
- **Look:** `reference/sections/05-dashboard.jpg` and its anatomy `reference/sections/05-dashboard.anatomy.jpg`.
- **Markup:** `reference/sections/05-dashboard.html`.
- **Pictures:** `reference/assets/images/038-supabase-table-editor-light.png` (2421×1365).
- **Motion:**
  - script `element.animate` on `section#dashboard:nth-of-type(3) > div.section-container.relative > div.relative.rounded-2xl:nth-of-type(2) > div.h-full.w-full:nth-of-type(2) > div.relative.w-full`: 100 ms ease-out, 2 keyframes (opacity, computedOffset)

## 06 · frameworks

- **Box:** 1440×696 px, starting 2533 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** grid, 2 columns (544px 544px), gap 0px.
- **Type:** Source Code Pro 500 13px/22.1px · Manrope 600 34px/37.7778px · Inter 450 12px/16px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 6 buttons, 1 link, 7 drawings.
- **Look:** `reference/sections/06-frameworks.jpg` and its anatomy `reference/sections/06-frameworks.anatomy.jpg`.
- **Markup:** `reference/sections/06-frameworks.html`.
- **Drawings:** `reference/assets/svg/046-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/047-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/048-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/049-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/050-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/051-icon-frameworks.svg` (icon, 28×28), `reference/assets/svg/052-icon-frameworks.svg` (icon, 12×12).
- **Motion:**
  - script `element.animate` on `div.section-container.relative > div.grid.grid-cols-1 > div.border.border-border:nth-of-type(2) > div.relative.overflow-auto:nth-of-type(2) > div`: 150 ms ease-out, 2 keyframes (opacity, computedOffset)

## 07 · examples

- **Box:** 1440×898 px, starting 3229 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 2, gap 16px, space-between/flex-end.
- **Type:** Inter 450 14px/20px · Manrope 500 14px/20px · Manrope 600 34px/37.7778px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 6 paragraphs, 7 links, 6 pictures.
- **Look:** `reference/sections/07-examples.jpg` and its anatomy `reference/sections/07-examples.anatomy.jpg`.
- **Markup:** `reference/sections/07-examples.html`.
- **Pictures:** `reference/assets/images/041-stripe.svg`, `reference/assets/images/042-nextjs.svg`, `reference/assets/images/043-openai.svg`, `reference/assets/images/044-langchain.svg`, `reference/assets/images/045-flutter.svg`, `reference/assets/images/046-expo.svg`.

## 08 · customer-stories

- **Box:** 1440×812 px, starting 4126 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 2, gap 16px, space-between/flex-end.
- **Type:** Manrope 450 22px/30.25px · Inter 450 12px/16px · Inter 450 12px/19.5px · Manrope 450 18px/24.75px · Manrope 600 34px/37.7778px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 24 paragraphs, 10 buttons, 7 links, 16 pictures.
- **Look:** `reference/sections/08-customer-stories.jpg` and its anatomy `reference/sections/08-customer-stories.anatomy.jpg`.
- **Markup:** `reference/sections/08-customer-stories.html`.
- **Pictures:** `reference/assets/images/047-lovable-homepage-icon.svg`, `reference/assets/images/048-bryan-byrne-lovable.jpg` (800×800), `reference/assets/images/049-exprealty-homepage-icon.svg`, `reference/assets/images/050-phoenix-energy-homepage-icon.svg`, `reference/assets/images/051-chatbase-homepage-icon.svg`, `reference/assets/images/052-rally-icon.svg`, `reference/assets/images/053-seth-siegler.jpg` (800×800), `reference/assets/images/054-kris-woods-phoenix-energy.jpg` (800×800), `reference/assets/images/055-yasser-elsaid-chatbase.jpg` (400×400), `reference/assets/images/056-thiago-peres-rally.jpg` (640×520).

## 09 · community

- **Box:** 1440×909 px, starting 4938 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** grid, 5 columns (288px 288px 288px 288px 288px), gap 8px.
- **Type:** Inter 450 15px/22.5px · Inter 500 14px/20px · Inter 450 16px/24px · Manrope 600 34px/37.7778px · Inter 500 14px/16px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 61 paragraphs, 31 links, 30 pictures, 30 drawings.
- **Look:** `reference/sections/09-community.jpg` and its anatomy `reference/sections/09-community.anatomy.jpg`.
- **Markup:** `reference/sections/09-community.html`.
- **Drawings:** `reference/assets/svg/053-icon-community.svg` (icon, 12×12, ×8), `reference/assets/svg/054-icon-community.svg` (icon, 12×12), `reference/assets/svg/055-icon-community.svg` (icon, 12×12), `reference/assets/svg/056-icon-community.svg` (icon, 12×12), `reference/assets/svg/057-icon-community.svg` (icon, 12×12, ×2), `reference/assets/svg/058-icon-community.svg` (icon, 12×12), `reference/assets/svg/059-icon-community.svg` (icon, 12×12), `reference/assets/svg/060-icon-community.svg` (icon, 12×12, ×7), `reference/assets/svg/061-icon-community.svg` (icon, 12×12), `reference/assets/svg/062-icon-community.svg` (icon, 12×12), `reference/assets/svg/063-icon-community.svg` (icon, 12×12, ×2), `reference/assets/svg/064-icon-community.svg` (icon, 12×12), and 3 more.
- **Motion:**
  - script `element.animate` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(3)`: 450 ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(2)`: 450 ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(3)`: 450 ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(2)`: 450 ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 2 keyframes (opacity, computedOffset)
  - script `element.animate` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(3)`: 450 ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 2 keyframes (opacity, computedOffset)
  - choreography: 30 elements (div) animate `transform` starting 23222–32335 ms after load, about 33 ms apart, each for about 6439 ms
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(2) > div:nth-of-type(1)` 29 times over 9145 ms (on load): from `scale(0.993413)` to `scale(0.98)`
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(1)` 28 times over 9113 ms (on load): from `scale(0.994867)` to `scale(0.98)`
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(1) > div:nth-of-type(2)` 28 times over 9261 ms (on load): from `scale(0.985153)` to `scale(0.98)`
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(3) > div:nth-of-type(1)` 28 times over 9177 ms (on load): from `scale(0.9917)` to `scale(0.98)`
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(4) > div:nth-of-type(1)` 28 times over 9194 ms (on load): from `scale(0.989745)` to `scale(0.98)`
  - script writes `transform` on `div.mx-auto > div.relative.overflow-hidden:nth-of-type(2) > div.grid.grid-cols-2:nth-of-type(1) > div.flex.flex-col:nth-of-type(5) > div:nth-of-type(1)` 28 times over 9227 ms (on load): from `scale(0.98754)` to `scale(0.98)`
  - and 24 more recorded tracks (motion.json `recorded`)
- **Film:** `reference/motion/films/01-scripted-community.jpg` (Scripted div: 108 moving parts (transform); it is `main#main > section#community:nth-of-type(7) > div.border-b.border-border > div.mx-auto > div.relative.overflow-hidden:nth-of-type(2)` in the markup; frames captioned with ms).

## 10 · open-source

- **Box:** 1440×373 px, starting 5847 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** stacked blocks.
- **Inside:** 1 heading, 1 paragraph, 1 link, 3 drawings.
- **Look:** `reference/sections/10-open-source.jpg` and its anatomy `reference/sections/10-open-source.anatomy.jpg`.
- **Markup:** `reference/sections/10-open-source.html`.
- **Drawings:** `reference/assets/svg/068-illustration-open-source.svg` (illustration, 720×372), `reference/assets/svg/069-icon-open-source.svg` (icon, 18×18).

## 11 · cta

- **Box:** 1440×375 px, starting 6220 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 2, gap 8px, normal/center.
- **Type:** Manrope 600 34px/40.8px · Inter 500 14px/20px (family weight size/line-height, most text first).
- **Inside:** 1 heading, 1 button, 2 links.
- **Look:** `reference/sections/11-cta.jpg` and its anatomy `reference/sections/11-cta.anatomy.jpg`.
- **Markup:** `reference/sections/11-cta.html`.

## 12 · footer

- **Box:** 1440×1097 px, starting 6595 px from the top. Background oklch(0.995 0 337.5), text oklch(0.1 0 337.5).
- **Layout:** flex row of 2, gap 112px, center/center.
- **Type:** Inter 450 14px/20px · Inter 450 16px/24px · Manrope 600 15px/22.5px · Inter 450 12px/16px · Inter 500 12px/16px (family weight size/line-height, most text first).
- **Inside:** 7 headings, 1 paragraph, 3 buttons, 69 links, 12 drawings, 1 field.
- **Look:** `reference/sections/12-footer.jpg` and its anatomy `reference/sections/12-footer.anatomy.jpg`.
- **Markup:** `reference/sections/12-footer.html`.
- **Drawings:** `reference/assets/svg/070-icon-footer.svg` (icon, 16×16, ×3), `reference/assets/svg/071-logo-supabase-logo.svg` (logo, 160×30), `reference/assets/svg/072-icon-footer.svg` (icon, 22×22), `reference/assets/svg/073-icon-footer.svg` (icon, 22×22), `reference/assets/svg/074-icon-footer.svg` (icon, 22×22), `reference/assets/svg/075-icon-footer.svg` (icon, 22×22), `reference/assets/svg/076-icon-footer.svg` (icon, 22×22), `reference/assets/svg/077-icon-footer.svg` (icon, 22×22), `reference/assets/svg/078-icon-footer.svg` (icon, 20×20).
