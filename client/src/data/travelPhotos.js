const root = '/images/travel';
export const travelPhotos = {
  hunza: {
    key: 'hunza',
    place: 'Attabad Lake, Hunza',
    author: 'Mohsin Kazmi',
    source: 'https://unsplash.com/photos/hSauWf_C26I',
    alt: 'Turquoise Attabad Lake between rugged mountains in Hunza',
    position: '50% 55%',
  },
  skardu: {
    key: 'skardu',
    place: 'Sadpara Lake, Skardu',
    author: 'Moez Mustafa',
    source: 'https://unsplash.com/photos/Q-HKwdLIiNA',
    alt: 'Blue-green Sadpara Lake beneath the mountains of Skardu',
    position: '50% 55%',
  },
  swat: {
    key: 'swat',
    place: 'Kalam, Swat Valley',
    author: 'Faisal Arshed',
    source: 'https://unsplash.com/photos/4ZFUM8z4Fho',
    alt: 'River and forested mountains beside Utrar Road in Kalam, Swat',
    position: '50% 50%',
  },
  fairy: {
    key: 'fairy-meadows',
    place: 'Fairy Meadows',
    author: 'Aqib Bilal',
    source: 'https://unsplash.com/photos/CeDlmoGAohE',
    alt: 'A green mountain valley and pine trees on the approach to Fairy Meadows',
    position: '50% 50%',
  },
  neelum: {
    key: 'neelum',
    place: 'Arang Kel, Neelum Valley',
    author: 'Jahanzeb Ahsan',
    source: 'https://unsplash.com/photos/dAtyMtnHO-4',
    alt: 'Green fields, village homes and a winding river in Neelum Valley',
    position: '50% 50%',
  },
  night: {
    key: 'fairy-night',
    place: 'Night sky, Fairy Meadows',
    author: 'Obaid Awan',
    source: 'https://unsplash.com/photos/nUc5Hba1McA',
    alt: 'Stars above the snow-covered Nanga Parbat mountain at Fairy Meadows',
    position: '50% 52%',
  },
};
export function photoUrl(photo, width = 1600) {
  return `${root}/${photo.key}${width === 640 ? '-640' : ''}.webp`;
}
export function getTourPhoto(tour) {
  const location = `${tour.slug || ''} ${tour.destination || ''}`.toLowerCase();
  if (/hunza/.test(location)) return travelPhotos.hunza;
  if (/skardu/.test(location)) return travelPhotos.skardu;
  if (/swat|kalam/.test(location)) return travelPhotos.swat;
  if (/fairy/.test(location)) return travelPhotos.fairy;
  if (/neelum|neelam/.test(location)) return travelPhotos.neelum;
  return null;
}
