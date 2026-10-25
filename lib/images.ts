// The owner's photos (assets/images). A photo that hasn't arrived yet is null, and screens show a plain dark space instead:
// never a made-up picture. When a new photo is added to assets/images, swap its null for require('@/assets/images/<name>.jpg').
export const photos = {
  onboarding: require('@/assets/images/onboarding.jpg') as number,
  home: null as number | null, // home.jpg: wide, about 1200 x 800, darker on the left for the headline
};
