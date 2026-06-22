import React from 'react';
import { BRAND_FULL, BRAND_LOGO_SRC } from '../../lib/brand';

const BrandLogo = ({ size = 40, className = '', variant = 'full' }) => {
  const isCompact = variant === 'compact';

  return (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_FULL}
      className={`brand-logo ${isCompact ? 'brand-logo--compact' : 'brand-logo--full'} ${className}`.trim()}
      style={{
        height: size,
        width: isCompact ? size : 'auto',
        maxWidth: isCompact ? size : size * 3.2,
      }}
      loading="eager"
      decoding="async"
    />
  );
};

export default BrandLogo;
