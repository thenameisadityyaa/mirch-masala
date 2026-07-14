import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Reusable star rating widget.
 * @param {number} value     - current rating (1-5, or 0 for none)
 * @param {function} onChange - called with new rating when interactive
 * @param {boolean} readOnly - if true, just displays stars
 * @param {number} size      - icon size (default 18)
 */
const StarRating = ({ value = 0, onChange, readOnly = false, size = 18 }) => {
  const [hovered, setHovered] = useState(0);
  const display = readOnly ? value : (hovered || value);

  return (
    <div
      style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}
      onMouseLeave={() => !readOnly && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{ cursor: readOnly ? 'default' : 'pointer', lineHeight: 1, transition: 'transform 0.1s' }}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onClick={() => !readOnly && onChange?.(star)}
        >
          <Star
            size={size}
            fill={star <= display ? '#f59e0b' : 'none'}
            color={star <= display ? '#f59e0b' : '#d1d5db'}
            style={{ display: 'block', transition: 'all 0.15s' }}
          />
        </span>
      ))}
    </div>
  );
};

export default StarRating;
