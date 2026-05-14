'use client';
import { useState } from 'react';

export default function LogoImg({ src, name, imgStyle }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="fb">{name?.[0] || '?'}</span>;
  }
  return (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      loading="lazy"
      style={imgStyle}
    />
  );
}
