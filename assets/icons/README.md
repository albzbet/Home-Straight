# App icons

The source drawings for the app icons. None of them hint at gambling.

- `sunrise.svg`: the default icon (`assets/icon.png`, the Android adaptive icon, the splash and the favicon).
- `leaf.svg` and `plain.svg`: the plainer icons people can switch to in Settings > App icon (`assets/icon-leaf*.png`,
  `assets/icon-plain*.png`, set up in `app.json` under `expo-alternate-app-icons`).

To change an icon, edit the SVG (any vector drawing app or a text editor) and export it again as a 1024 × 1024 PNG with the
same file names. Android "foreground" images are the drawing alone on a see-through background, shrunk to about 70% so
it fits inside Android's round mask.
