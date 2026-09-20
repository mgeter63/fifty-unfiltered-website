# Reel wall and quote slider: how to edit

## Add a short to the reel wall
1. Export the vertical video (9:16) as MP4, 1080x1920 or smaller, under 15 MB. Handbrake or the free tool at
   https://www.freeconvert.com/video-compressor both work.
2. Upload the MP4 to `public/reels/` and a poster image (a still frame, JPG, same 9:16 shape) next to it.
3. Open `content/reels.json` and add a block at the TOP of the list:

```
  {
    "title": "What I stopped doing for people",
    "poster": "/reels/stopped-doing.jpg",
    "video": "/reels/stopped-doing.mp4",
    "link": "https://www.instagram.com/reel/XXXX"
  },
```

Every block needs a comma after it except the last one. `link` is optional: if `video` is empty, tapping the
card opens the link instead. Delete the five "Sample reel" blocks once you have real ones.
If the list is empty the section disappears from the home page.

## Change the quote slider
Open `content/quotes.json`. Each line in quotes is one slide. Keep the commas between lines and no comma
after the last one. Ten words or fewer reads best.

## Swap the hero photo or add the hero video
- Photo: upload a landscape JPG named exactly `hero.jpg` to `public/images/`. It replaces the current one.
- Video: upload an MP4 named exactly `hero.mp4` to `public/video/` (muted, 10 to 20 seconds, 1920x1080,
  under 8 MB). The site finds it automatically and plays it on loop behind the headline. The photo stays
  as the fallback for phones on slow connections and for people who turn off motion.
  Optional: also upload `hero.webm` for a smaller file on Android and Chrome.
