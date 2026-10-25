# App icons

The source drawings for the app icons. None of them hint at gambling.

- The default icon is the homestr8 kelpie (`assets/logo/kelpie.png`, made from the owner's `kelpie-source.png`): charcoal on
  burnt copper for `assets/icon.png`, the Android adaptive icon and the favicon; white for the splash, the notification icon
  and Android's monochrome icon. `sunrise.svg` was the old default, kept for reference.
- `leaf.svg` and `plain.svg`: the plainer icons people can switch to in Settings > App icon (`assets/icon-leaf*.png`,
  `assets/icon-plain*.png`, set up in `app.json` under `expo-alternate-app-icons`).

To change an icon, edit the SVG (any vector drawing app or a text editor) and export it again as a 1024 × 1024 PNG with the
same file names. Android "foreground" images are the drawing alone on a see-through background, shrunk to about 70% so
it fits inside Android's round mask.
