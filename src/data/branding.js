import logo from '../../Docs/fortress-logo-draft.svg';
import master from '../../Docs/fortress-logo-draft.svg?raw';
const svgUrl = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const symbol = [...master.matchAll(/<path\b[^>]*\/>/g)].map(match => match[0]).join('');
export const branding = Object.freeze({ logo,
  logoWhite: svgUrl(master.replaceAll('#173B8F', '#ffffff')),
  logoStacked: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="340" viewBox="0 0 260 340"><g fill="#173B8F" transform="translate(9 20)">${symbol}</g><g fill="#173B8F" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700"><text x="130" y="278" font-size="35" textLength="245" lengthAdjust="spacingAndGlyphs">FORTRESS</text><text x="130" y="307" font-size="16" letter-spacing="5">STEEL INC.</text></g></svg>`),
  company: 'Fortress Steel Inc.', title: 'Company Fun Run', blue: '#173b8f', white: '#ffffff', accent: '#55b9ff' });
