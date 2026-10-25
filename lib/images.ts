// The owner's photos (assets/images). A photo that hasn't arrived yet is null, and screens show a plain dark space instead:
// never a made-up picture. When a new photo is added to assets/images, swap its null for require('@/assets/images/<name>.jpg').
export const photos = {
  onboarding: require('@/assets/images/onboarding.jpg') as number,
  home: null as number | null, // home.jpg: wide, about 1200 x 800, darker on the left for the headline
  progress: null as number | null, // progress.jpg: wide strip, about 1200 x 600, someone out walking (Progress screen)
  session: null as number | null, // session.jpg: video shape, about 1600 x 900, the cover picture for the lesson videos
  // More life screen: the welcome photo for now. Its own photo later: more-life.jpg, tall, about 1080 x 1920.
  moreLife: require('@/assets/images/onboarding.jpg') as number | null,
  mission: null as number | null, // mission.jpg: wide, about 1200 x 800, someone outdoors (weekly missions)
  // tricks-1.jpg ... tricks-4.jpg: square, about 800 x 800, one per Bookie Tricks Exposed episode (by episode number).
  tricks: [null, null, null, null] as (number | null)[],
};
