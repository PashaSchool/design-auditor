import { describe, it, expect } from 'vitest';
import { checkLinks } from '@rules/links.rules.js';
import type { LinksData } from '@extractors/links.js';

function makeData(overrides: Partial<LinksData> = {}): LinksData {
  return {
    links: [
      {
        href: 'https://example.com',
        text: 'Example',
        color: 'rgb(26,115,232)',
        textDecoration: 'underline',
        fontSize: 16,
        isExternal: true,
        hasUnderline: true,
        hasBorder: false,
        context: 'main',
      },
    ],
    uniqueColors: ['rgb(26,115,232)'],
    noUnderlineNoAlt: [],
    inconsistentColors: false,
    hasVisitedStyle: true,
    hasFocusStyle: true,
    ...overrides,
  };
}

describe('checkLinks', () => {
  it('passes when no links found', () => {
    const v = checkLinks(makeData({ links: [] }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-none', severity: 'pass' })
    );
  });

  it('passes with well-styled links', () => {
    const v = checkLinks(makeData());
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-wcag-ok', severity: 'pass' })
    );
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-visited-ok', severity: 'pass' })
    );
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-focus-ok', severity: 'pass' })
    );
  });

  it('errors when links distinguished by color only', () => {
    const link = {
      href: '#',
      text: 'Bad link',
      color: 'rgb(0,0,255)',
      textDecoration: 'none',
      fontSize: 16,
      isExternal: false,
      hasUnderline: false,
      hasBorder: false,
      context: 'main',
    };
    const v = checkLinks(makeData({ noUnderlineNoAlt: [link] }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-color-only', severity: 'error' })
    );
  });

  it('warns when no :visited style', () => {
    const v = checkLinks(makeData({ hasVisitedStyle: false }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-no-visited', severity: 'warn' })
    );
  });

  it('errors when no :focus style', () => {
    const v = checkLinks(makeData({ hasFocusStyle: false }));
    expect(v).toContainEqual(
      expect.objectContaining({ id: 'links-no-focus', severity: 'error' })
    );
  });

  it('warns with inconsistent link colors', () => {
    const v = checkLinks(
      makeData({
        uniqueColors: ['blue', 'red', 'green', 'purple'],
        inconsistentColors: true,
      })
    );
    expect(v).toContainEqual(
      expect.objectContaining({
        id: 'links-inconsistent-colors',
        severity: 'warn',
      })
    );
  });
});
