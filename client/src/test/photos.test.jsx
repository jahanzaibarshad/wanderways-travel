import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import landscape from '../assets/hero-landscape.svg';
import { getTourPhoto, travelPhotos, photoUrl } from '../data/travelPhotos.js';
import TravelImage from '../components/TravelImage.jsx';
import TourCard from '../components/TourCard.jsx';
import Hero from '../components/Hero.jsx';
import PhotoCreditsPage from '../pages/PhotoCreditsPage.jsx';

describe('Real destination photography', () => {
  it('maps all five seeded destinations to their own photographs', () => {
    for (const [destination, photo] of [
      ['Hunza Valley', travelPhotos.hunza],
      ['Skardu', travelPhotos.skardu],
      ['Swat Valley', travelPhotos.swat],
      ['Fairy Meadows', travelPhotos.fairy],
      ['Neelum Valley', travelPhotos.neelum],
    ])
      expect(getTourPhoto({ destination })).toBe(photo);
    expect(getTourPhoto({ slug: 'hunza-valley' })).toBe(travelPhotos.hunza);
    expect(getTourPhoto({ destination: 'Unknown place' })).toBeNull();
  });
  it('ships valid local WebP originals and responsive versions for every photo', () => {
    for (const photo of Object.values(travelPhotos))
      for (const width of [640, 1600]) {
        const bytes = readFileSync(resolve('public', photoUrl(photo, width).slice(1)));
        expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
        expect(bytes.subarray(8, 12).toString()).toBe('WEBP');
      }
  });
  it('uses lazy loading and responsive sources for supporting images', () => {
    render(<TravelImage photo={travelPhotos.swat} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('srcset', expect.stringContaining('swat-640.webp 640w'));
    expect(image).toHaveAccessibleName(travelPhotos.swat.alt);
  });
  it('loads the hero photo eagerly at high priority', () => {
    render(
      <MemoryRouter>
        <Hero />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img', { name: travelPhotos.hunza.alt })).toHaveAttribute(
      'fetchpriority',
      'high',
    );
    expect(screen.getByRole('img', { name: travelPhotos.hunza.alt })).toHaveAttribute(
      'loading',
      'eager',
    );
  });
  it('falls back to the existing illustration on load failure without a retry loop', () => {
    render(<TravelImage photo={travelPhotos.neelum} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveAttribute('src', landscape);
    expect(screen.getByRole('img')).not.toHaveAttribute('srcset');
    expect(screen.getByRole('img')).toHaveAccessibleName(/photograph unavailable/);
  });
  it('keeps the right destination image when a card index changes', () => {
    const tour = {
      _id: 'one',
      destination: 'Neelum Valley',
      title: 'Riverside Retreat',
      slots: [],
      price: 56000,
      duration: 4,
    };
    const { rerender } = render(
      <MemoryRouter>
        <TourCard tour={tour} index={0} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/travel/neelum.webp');
    rerender(
      <MemoryRouter>
        <TourCard tour={tour} index={4} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', '/images/travel/neelum.webp');
  });
  it('provides source and license credits for all downloaded images', () => {
    render(<PhotoCreditsPage />);
    expect(screen.getAllByRole('img')).toHaveLength(6);
    for (const photo of Object.values(travelPhotos))
      expect(
        screen.getByRole('link', { name: `Photo by ${photo.author} on Unsplash ↗` }),
      ).toHaveAttribute('href', photo.source);
    expect(screen.getByRole('link', { name: 'Unsplash License' })).toHaveAttribute(
      'href',
      'https://unsplash.com/license',
    );
  });
});
