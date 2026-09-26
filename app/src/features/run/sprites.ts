/**
 * SVG sprites, pre-rasterised once at device resolution.
 *
 * drawImage() with an <img> holding SVG rasterises at the SVG's intrinsic size
 * and then scales the bitmap, which goes soft on a 3x screen. Baking each one
 * into an offscreen canvas at width*dpr up front costs a few ms at boot and
 * keeps every later draw both crisp and cheap.
 */
export type SpriteSheet<K extends string> = Record<K, CanvasImageSource>;

const rasterise = (
  url: string,
  width: number,
  height: number,
  dpr: number
): Promise<CanvasImageSource> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const target = document.createElement('canvas');
      target.width = Math.ceil(width * dpr);
      target.height = Math.ceil(height * dpr);
      const ctx = target.getContext('2d');
      if (!ctx) return reject(new Error(`no context while rasterising ${url}`));
      ctx.drawImage(image, 0, 0, target.width, target.height);
      resolve(target);
    };
    image.onerror = () => reject(new Error(`sprite failed to load: ${url}`));
    image.src = url;
  });

export const loadSprites = async <K extends string>(
  entries: ReadonlyArray<readonly [K, string, number, number]>,
  dpr: number
): Promise<SpriteSheet<K>> => {
  const bitmaps = await Promise.all(
    entries.map(([, url, width, height]) => rasterise(url, width, height, dpr))
  );
  return Object.fromEntries(entries.map(([key], i) => [key, bitmaps[i]])) as SpriteSheet<K>;
};
