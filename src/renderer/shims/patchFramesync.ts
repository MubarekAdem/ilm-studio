// Polyfill: Fix framesync CJS default export interop for Chakra UI PanEvent (used in Sliders)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const framesync = require('framesync');
  if (framesync && framesync.default && typeof framesync.update !== 'function') {
    Object.assign(framesync, framesync.default);
  }
} catch (e) {
  console.warn('[framesync-shim] Failed to patch framesync:', e);
}

export {};
