export interface PartOffer {
  seller: string;
  url: string;
  priceInr: number;
  checkedAt: string;
  inStock: boolean;
}

export const VERIFIED_PART_PRICES: Record<string, PartOffer[]> = {
  rpi_zero_2w: [
    { seller: 'Robu.in', priceInr: 1709, checkedAt: '2026-11-15', inStock: true, url: 'https://robu.in/product/raspberry-pi-zero-2-w/' }
  ],
  rpi_5: [
    { seller: 'Robu.in', priceInr: 12331, checkedAt: '2026-11-15', inStock: true, url: 'https://robu.in/product/raspberry-pi-5-model-4gb/' }
  ],
  inmp441_mic: [
    { seller: 'Robosap.in', priceInr: 162.84, checkedAt: '2026-11-15', inStock: true, url: 'https://robosap.in/product/inmp441-mems-high-precision-omnidirectional-microphone-module-i2s/' },
    { seller: 'Hubtronics.in', priceInr: 177, checkedAt: '2026-11-15', inStock: true, url: 'https://hubtronics.in/inmp441-omnidirectional-microphone-module' },
    { seller: 'Robu.in', priceInr: 170, checkedAt: '2026-11-15', inStock: false, url: 'https://oldwp.robu.in/product/inmp441-mems-high-precision-omnidirectional-microphone-module-i2s/' }
  ],
  max98357a_amp: [
    { seller: 'Robu.in (SmartElex)', priceInr: 185, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product-category/smartelex/smartelex-audio-modules/' },
    { seller: 'Robu.in (Adafruit)', priceInr: 730, checkedAt: '2026-11-15', inStock: true, url: 'https://robu.in/product/adafruit-max98357a-i2s-3w-class-d-amplifier-breakout-board/' }
  ],
  oled_096: [
    { seller: 'Robu.in', priceInr: 219, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product/0-96-inch-i2c-iic-oled-lcd-module-4pin-with-vcc-gnd-white/' }
  ],
  tp4056: [
    { seller: 'Robu.in', priceInr: 43, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product/tp4056-1a-li-ion-lithium-battery-charging-module-with-current-protection-mini-usb/' }
  ],
  mt3608: [
    { seller: 'Robu.in', priceInr: 33, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product-tag/mt3608/' }
  ],
  arduino_uno: [
    { seller: 'Robu.in', priceInr: 426.69, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product/arduino-uno-r3/' }
  ],
  dht11: [
    { seller: 'Robu.in', priceInr: 48, checkedAt: '2026-11-15', inStock: true, url: 'https://oldwp.robu.in/product/dht11-digital-relative-humidity-temperature-sensor-module/' }
  ]
};

export function getOffersForPart(part: { id?: string; libId?: string; name?: string }): PartOffer[] | null {
  const key = (part.libId || part.id || '').toLowerCase();
  const name = (part.name || '').toLowerCase();

  for (const [id, offers] of Object.entries(VERIFIED_PART_PRICES)) {
    if (key === id || key.includes(id) || id.includes(key)) return offers;
    if (id === 'rpi_zero_2w' && (name.includes('zero 2') || name.includes('raspberry pi zero'))) return offers;
    if (id === 'rpi_5' && name.includes('raspberry pi 5')) return offers;
    if (id === 'inmp441_mic' && (name.includes('inmp441') || name.includes('mems mic') || key.includes('inmp441'))) return offers;
    if (id === 'max98357a_amp' && (name.includes('max98357') || name.includes('i2s amp') || key.includes('max98357'))) return offers;
    if (id === 'oled_096' && (name.includes('oled') || name.includes('ssd1306'))) return offers;
    if (id === 'tp4056' && name.includes('tp4056')) return offers;
    if (id === 'mt3608' && name.includes('mt3608')) return offers;
    if (id === 'arduino_uno' && name.includes('uno')) return offers;
    if (id === 'dht11' && name.includes('dht11')) return offers;
  }
  return null;
}

export function getCheapestInStockPrice(offers: PartOffer[]): number | null {
  const inStock = offers.filter(o => o.inStock);
  const pool = inStock.length > 0 ? inStock : offers;
  if (pool.length === 0) return null;
  return Math.min(...pool.map(o => o.priceInr));
}

export function getSearchLinks(partName: string) {
  const q = encodeURIComponent(partName);
  return {
    robu: `https://robu.in/?s=${q}&post_type=product`,
    amazon: `https://www.amazon.in/s?k=${q}`
  };
}
