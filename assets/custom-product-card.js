class CustomProductCard extends HTMLElement {
  #variantImages = {};
  #currentVariantId = null;

  connectedCallback() {
    this.#parseVariantMap();
    this.#bindSwatches();
    this.#bindHover();
    requestAnimationFrame(() => this.#syncToCheckedSwatch());
    window.addEventListener('pageshow', this.#onPageShow);
  }

  disconnectedCallback() {
    window.removeEventListener('pageshow', this.#onPageShow);
  }

  #onPageShow = () => {
    this.#syncToCheckedSwatch();
  };

  #syncToCheckedSwatch() {
    const checked = this.querySelector('input[type="radio"][data-swatch-value]:checked');
    if (!checked) return;
    const variantId = checked.dataset.variantId;
    if (!variantId || variantId === this.#currentVariantId) return;
    this.#currentVariantId = variantId;
    this.#applyVariantImages(variantId, { hover: false });
    this.#updateCardLinks(variantId);
    this.#updatePricing(variantId);
  }

  #parseVariantMap() {
    const script = this.querySelector('[data-variant-image-map]');
    if (!script) return;
    try {
      const data = JSON.parse(script.textContent);
      this.#variantImages = data.variantImages ?? {};
      this.#currentVariantId = String(data.currentVariantId);
    } catch {}
  }

  get #primaryImage() {
    return this.querySelector('[data-ref="primaryImage"]');
  }

  get #secondaryImage() {
    return this.querySelector('[data-ref="secondaryImage"]');
  }

  get #imageContainer() {
    return this.querySelector('[data-ref="imageContainer"]');
  }

  get #saleBadge() {
    return this.querySelector('[data-ref="saleBadge"]');
  }

  get #comparePrice() {
    return this.querySelector('[data-ref="comparePrice"]');
  }

  get #currentPrice() {
    return this.querySelector('[data-ref="currentPrice"]');
  }

  #bindSwatches() {
    this.addEventListener('change', (e) => {
      const input = e.target;
      if (input.type !== 'radio' || !('swatchValue' in input.dataset)) return;
      const variantId = input.dataset.variantId;
      if (!variantId) return;
      this.#currentVariantId = variantId;
      this.#applyVariantImages(variantId, { hover: false });
      this.#updateCardLinks(variantId);
      this.#updatePricing(variantId);
    });
  }

  #applyVariantImages(variantId, { hover = false } = {}) {
    const entry = this.#variantImages[variantId];
    if (!entry) return;

    const primary = this.#primaryImage;
    const secondary = this.#secondaryImage;

    if (primary && entry.primary) {
      primary.srcset = '';
      primary.src = entry.primary;
    }

    if (secondary) {
      if (entry.secondary) {
        secondary.srcset = '';
        secondary.src = entry.secondary;
        secondary.hidden = false;
        secondary.removeAttribute('aria-hidden');
      } else {
        secondary.hidden = true;
        secondary.setAttribute('aria-hidden', 'true');
      }

      if (hover) {
        primary?.classList.add('opacity-0');
        secondary.classList.remove('opacity-0');
      } else {
        primary?.classList.remove('opacity-0');
        secondary.classList.add('opacity-0');
      }
    }
  }

  #updateCardLinks(variantId) {
    const entry = this.#variantImages[variantId];
    const variantUrl = entry?.url;

    ['[data-ref="imageLink"]', '[data-ref="titleLink"]'].forEach((selector) => {
      const link = this.querySelector(selector);
      if (!link) return;
      if (variantUrl) {
        link.href = variantUrl;
      } else {
        try {
          const url = new URL(link.href, window.location.origin);
          url.searchParams.set('variant', variantId);
          link.href = url.toString();
        } catch {}
      }
    });
  }

  #updatePricing(variantId) {
    const entry = this.#variantImages[variantId];
    if (!entry) return;

    const badge = this.#saleBadge;
    const comparePrice = this.#comparePrice;
    const currentPrice = this.#currentPrice;

    if (badge) badge.hidden = !entry.onSale;

    if (comparePrice) {
      comparePrice.hidden = !entry.onSale;
      if (entry.onSale && entry.compareAtPrice) comparePrice.textContent = entry.compareAtPrice;
    }

    if (currentPrice) {
      if (entry.price) currentPrice.textContent = entry.price;
      currentPrice.classList.toggle('text-red-500', entry.onSale);
      currentPrice.classList.toggle('text-black-900', !entry.onSale);
    }
  }

  #bindHover() {
    const container = this.#imageContainer;
    if (!container) return;
    container.addEventListener('mouseenter', () => this.#showSecondaryImage());
    container.addEventListener('mouseleave', () => this.#showPrimaryImage());
  }

  #showSecondaryImage() {
    if (!this.#currentVariantId) return;
    const entry = this.#variantImages[this.#currentVariantId];
    if (!entry?.secondary) return;
    const secondary = this.#secondaryImage;
    if (!secondary || secondary.hidden) return;
    if (secondary.src !== entry.secondary) {
      secondary.srcset = '';
      secondary.src = entry.secondary;
    }
    this.#primaryImage?.classList.add('opacity-0');
    secondary.classList.remove('opacity-0');
  }

  #showPrimaryImage() {
    this.#primaryImage?.classList.remove('opacity-0');
    this.#secondaryImage?.classList.add('opacity-0');
  }
}

if (!customElements.get('custom-product-card')) {
  customElements.define('custom-product-card', CustomProductCard);
}
