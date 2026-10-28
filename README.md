# İlker Tekin Hairstylist — demo

A member app and a salon screen for **İlker Tekin Hairstylist & Academy**, the hair salon at Poeijersstraat 37 in
Eindhoven. This is a demo with test data only: a fictional team besides İlker, fictional clients, and no real bookings
or payments.

- Live demo: https://yilmazeyup.github.io/ilker-tekin-demo/ (a start page with the app and the salon screen side by side)
- Member app: https://yilmazeyup.github.io/ilker-tekin-demo/app/
- Salon screen: https://yilmazeyup.github.io/ilker-tekin-demo/admin/ (`?at=2026-10-28T14:20` sets the salon clock)

## What's in it

**Member app:** everything the salon's site offers (the menu with prices per hair length, Book now, opening hours,
address, contact, socials, the Olaplex explainer) plus twenty additions: the salon live (busy, wait, next free chair,
walk-in queue), colour and cut tried on your own photo with on-device AI, a swipe deck of looks, a consult with photos
before the visit, a hair passport with the colour formula, a regrowth reminder, a hair quiz, a waitlist, the live visit
(QR check-in, processing timer, "your stylist runs late"), a drink to your chair, the Club with gift cards and referrals,
a shop with pick-up, aftercare with reminders, bridal and event packages, two chairs side by side, reviews with a photo,
paying and tipping in the app, a frizz forecast from today's humidity in Eindhoven, stylist portfolios and an extensions
planner. The opening is an AI clip of a hair toss made in Canva.

**Salon screen:** the salon in 3D (five chairs with mirrors, two basins, the colour bar, the desk with the product wall,
the waiting sofa) with a live card per chair: client, stylist, treatment, step and time left. Who waits, who is next and
who runs late; the day moves on its own or plays in a minute. The agenda per stylist and clients with their colour
formulas. The team (on podiums as high as their day is full), the week's sales (columns per day, by kind of treatment)
and the shop (the product wall with stock and the pick-up counter) are rooms in 3D too, with a 3D/2D switch. What the
member does in the app (check in, join the queue, order a drink, send consult photos, book, pay) shows up here at once.

## Real and demo

The menu, prices and times (from the salon's "Book now" on Treatwell), the address, phone, e-mail, opening hours,
socials and the brands (L'Oréal Professionnel, Olaplex) are the salon's own (October 2026). İlker is shown only with
what his site says ("Hairstylist & Academy"). The rest is demo: Selin, Noor, Daan, Lina and Kim, every client
(including Yara), the Club, gift cards, shop prices and stock, the drinks menu. The hair pictures are 3D renders made
in code; the intro clip and the try-on example are AI images, labelled as such. There are no made-up reviews.

## Structure

```
apps/app/          the member app (Expo SDK 58, Expo Router), also exported for the web
apps/admin/        the salon screen (Vite, React, Three.js)
packages/shared/   the salon's data, the demo day, the clock and the app-to-screen link
site/              the demo site's start page
scripts/           builds and serves the demo site the way GitHub Pages publishes it
```

## Run

```bash
npm install
npm run web
```

The app opens on http://localhost:8095. The salon screen has its own install, outside the npm workspaces (npm 10
stumbles over Vite 8's optional peers there):

```bash
npm --prefix apps/admin install
npm run admin
```

It opens on http://localhost:5186. `npm run typecheck` checks both.

## The demo site

`npm run site` builds what GitHub Pages publishes into `_site/`: the start page at `/`, the app at `/app/`, the salon
screen at `/admin/`, and a copy of the app as `404.html`, so a link straight to a screen opens the app on that screen.
`npm run site:serve` serves it on http://localhost:8105/ilker-tekin-demo/. Every push to `main` builds and publishes
the site (`.github/workflows/pages.yml`).

## Notes

- The salon clock follows Eindhoven time while the salon is open; when it is closed, both the app and the screen
  replay 10:30 to 16:30 of the last open day at real speed, so the floor is always alive.
- The app and the screen share the browser's storage on the same site: open both (or the start page) to see the link.
- The try-on loads Google MediaPipe from its CDN when it opens; photos stay in the browser.
- The frizz forecast asks Open-Meteo for the weather at the salon's coordinates; offline it shows a demo day.
- `?intro=0` skips the app's opening.
