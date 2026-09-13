/**
 * UI atoms shared between screens.
 *
 * These lived in the garage, which was their only caller until the shop needed
 * the same coin mark, the same chevrons and the same level pips. Copying them
 * would have meant two coins that could drift apart.
 */
export const COIN = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
  <circle cx="12" cy="12" r="9.4" fill="#C98A0E"/>
  <circle cx="12" cy="12" r="9.4" fill="none" stroke="#6B4708" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="6.4" fill="#FFC93C"/>
  <path d="M9.4 12h5.2M12 9.4v5.2" stroke="#8A5B08" stroke-width="1.9" stroke-linecap="round"/></svg>`;

export const chevron = (dir: 'left' | 'right'): string =>
  `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#F28D35"
        stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="${dir === 'left' ? 'M14.6 5.4 8 12l6.6 6.6' : 'M9.4 5.4 16 12l-6.6 6.6'}"/></svg>`;

export const meter = (value: number): string =>
  `<span class="meter">${Array.from(
    { length: 6 },
    (_, i) => `<i class="pip${i < value ? ' pip--on' : ''}"></i>`
  ).join('')}</span>`;
