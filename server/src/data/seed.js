import Tour from '../models/Tour.js';

export function sampleTours() {
  return [
    [
      'Hunza Valley',
      'Peaks, Passes & Apricot Trails',
      'hunza-valley',
      92000,
      7,
      'Explore mountain villages, Baltit Fort and the Karakoram with local guides and relaxed valley walks.',
    ],
    [
      'Skardu',
      'Cold Desert & Alpine Lakes',
      'skardu-lakes',
      84000,
      6,
      'Discover Shigar, the Katpana desert and turquoise alpine lakes on a small-group mountain escape.',
    ],
    [
      'Swat Valley',
      'Forests, Rivers & Hidden Villages',
      'swat-valley',
      67000,
      5,
      'Follow rivers through pine forests, meet local hosts and slow down in the green valleys of Swat.',
    ],
    [
      'Fairy Meadows',
      'Beneath the Nanga Parbat Sky',
      'fairy-meadows',
      78000,
      5,
      'A guided hiking journey with mountain cabins, forest trails and spectacular views of Nanga Parbat.',
    ],
    [
      'Neelum Valley',
      'Riverside Retreat',
      'neelum-valley',
      56000,
      4,
      'Enjoy riverside stays, village walks and peaceful mountain scenery in Neelum Valley.',
    ],
  ].map(([destination, title, slug, price, duration, description]) => ({
    destination,
    title,
    slug,
    price,
    duration,
    description,
    slots: [14, 28, 42].map((days) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() + days);
      date.setUTCHours(8, 0, 0, 0);
      return { date, capacity: 12, bookedSeats: 0 };
    }),
  }));
}

export async function seedTours() {
  let inserted = 0;
  for (const tour of sampleTours()) {
    const result = await Tour.updateOne(
      { slug: tour.slug },
      { $setOnInsert: tour },
      { upsert: true, runValidators: true },
    );
    inserted += result.upsertedCount;
  }
  return inserted;
}
