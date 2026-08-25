import { describe, expect, it } from 'vitest';
import {
  displayProductName,
  extractGsmSpec,
  withClientProductCopy,
} from './copy';

describe('displayProductName', () => {
  it('strips 350GSM from carpenter titles', () => {
    expect(displayProductName('playR Street Carpenter Pant Fleece 350GSM (Grey)')).toBe(
      'playR Street Carpenter Pant Fleece (Grey)'
    );
  });

  it('strips spaced GSM tokens', () => {
    expect(displayProductName('Waffle Tee 220 GSM White')).toBe('Waffle Tee White');
  });

  it('leaves titles without GSM unchanged', () => {
    expect(displayProductName('playR Street INSPIRED Tee (Purple)')).toBe(
      'playR Street INSPIRED Tee (Purple)'
    );
  });
});

describe('withClientProductCopy', () => {
  it('forces waffle copy to 220 GSM and does not rewrite carpenter 350', () => {
    const waffle = withClientProductCopy('PS-TEE-CRT-WHT', 'Waffle Tee', 'Heavy 350 GSM knit.');
    expect(waffle).toContain('220 GSM');
    expect(waffle).not.toMatch(/350/);

    const carpenter = withClientProductCopy(
      'PS-PNT-CARP-GRY',
      'Carpenter Pant Fleece 350GSM (Grey)',
      'Relaxed carpenter pant.'
    );
    expect(carpenter).toContain('350 GSM');
    expect(carpenter).not.toMatch(/220/);
  });
});

describe('extractGsmSpec', () => {
  it('reads numeric GSM', () => {
    expect(extractGsmSpec('Fleece 350GSM')).toBe('350 GSM');
    expect(extractGsmSpec('no spec')).toBeNull();
  });
});
