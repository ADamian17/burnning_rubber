/** Minimal DOM helpers — the screens are markup, so keep the plumbing thin. */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

interface Raw {
  readonly __raw: string;
}

const isRaw = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && '__raw' in value;

/** Marks a string as already-safe markup (an inline SVG, a nested template). */
export const raw = (value: string): Raw => ({ __raw: value });

/** Tagged template that escapes interpolated values unless marked raw. */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings.reduce((out, chunk, i) => {
    if (i === 0) return chunk;
    const value = values[i - 1];
    const text = isRaw(value) ? value.__raw : String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
    return out + text + chunk;
  }, '');

export const on = (
  root: ParentNode,
  selector: string,
  event: string,
  handler: (element: HTMLElement) => void
): void => {
  root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
    element.addEventListener(event, (e) => {
      e.preventDefault();
      handler(element);
    });
  });
};
