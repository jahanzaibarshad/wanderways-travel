import { useState } from 'react';
import { photoUrl } from '../data/travelPhotos.js';
import landscape from '../assets/hero-landscape.svg';

export default function TravelImage({
  photo,
  className = '',
  priority = false,
  sizes = '(max-width: 760px) 100vw, 50vw',
}) {
  const [failedSource, setFailedSource] = useState('');
  const src = photo ? photoUrl(photo) : landscape;
  const fallback = !photo || failedSource === src;
  return (
    <img
      className={className}
      src={fallback ? landscape : src}
      srcSet={fallback ? undefined : `${photoUrl(photo, 640)} 640w, ${src} 1600w`}
      sizes={sizes}
      width="1600"
      height="1000"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      style={{ objectPosition: photo?.position }}
      alt={
        fallback ? 'Illustrated mountain landscape; destination photograph unavailable' : photo.alt
      }
      onError={() => setFailedSource(src)}
    />
  );
}
