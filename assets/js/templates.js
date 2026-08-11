/* Single source of truth for the screensaver deck: order, folder, and copy.
   Read by the launcher grid (index.html) and by deck-nav.js, which runs inside
   each screensaver so Previous/Next follow the same order shown on the menu.
   Plain global instead of JSON + fetch so it also works over file://. */
window.NTV_TEMPLATES = [
  {
    slug: "review-1",
    title: "Google Review Spotlight",
    desc: "Single 5-star review with drifting gradient background and glowing orbs",
  },
  {
    slug: "review-2",
    title: "Client Testimonial",
    desc: "Light backdrop with floating brand blobs, spinning rings, and a testimonial card",
  },
  {
    slug: "review-3",
    title: "Review Billboard",
    desc: "Auto-rotating pull-quote beside a spinning-ring portrait card, with a live rating ticker footer",
  },
  {
    slug: "review-5",
    title: "Editorial Quote",
    desc: "Oversized quotation mark behind a magazine-style pull-quote",
  },
  {
    slug: "review-6",
    title: "Light Score Card",
    desc: "Light theme with a 5.0 score card beside the review text",
  },
  {
    slug: "review-7",
    title: "NTV360 Review Board",
    desc: "Dark drifting-glow review panel beside a magenta NTV360 contact sidebar",
  },
  {
    slug: "review-8",
    title: "Bold Banner",
    desc: "Editorial layout with a giant quote mark and a violet score sidebar",
  },
  {
    slug: "review-9",
    title: "Contact Panel",
    desc: "Clean quote on white with a navy contact sidebar and dot-grid corner accent",
  },
  {
    slug: "review-10",
    title: "Rating Hero",
    desc: "Bold 5.0 numeral on a navy gradient with soft abstract blobs and a grid overlay",
  },
  {
    slug: "review-11",
    title: "Minimal Quote",
    desc: "Tight bold sans-serif quote on light gray with a concentric arc accent",
  },
  {
    slug: "review-14",
    title: "Minimal Quote — Dark",
    desc: "White review card floating on a dark navy backdrop with brand-color blooms",
  },
  {
    slug: "review-12",
    title: "Diagonal Split",
    desc: "Angled navy panel with initials badge and rating beside a bright quote column",
  },
  {
    slug: "review-13",
    title: "Review Card",
    desc: "SaaS-style widget card weighting photo, score, quote and contact evenly",
  },
  {
    slug: "review-15",
    title: "Review Card — Dark",
    desc: "Same widget card floating on a dark navy backdrop with brighter accent shapes",
  },
  {
    slug: "review-17",
    title: "Contact & Review — Dark",
    desc: "Serif hero header over a three-card contact grid, with a review band below",
  },
  {
    slug: "review-18",
    title: "Contact & Review — Light",
    desc: "Same layout on a warm paper backdrop with a light review band",
  },
  {
    slug: "review-19",
    title: "Signal",
    desc: "Blueprint-grid layout with a mono rating readout beside a bordered contact card",
  },
  {
    slug: "review-20",
    title: "Arch",
    desc: "Warm editorial layout with an arched portrait framed by the quote on one side and contact details on the other",
  },
  {
    slug: "review-21",
    title: "Aurora",
    desc: "Dark drifting aurora blooms behind a centered review and star rating",
  },
  {
    slug: "review-22",
    title: "Editorial",
    desc: "Warm clay side panel beside a cream serif pull-quote layout",
  },
  {
    slug: "review-24",
    title: "Location Billboard",
    desc: "Deep teal faux street-map backdrop with the address as the loudest element",
  },
  {
    slug: "review-25",
    title: "Map Card",
    desc: "Blush plum layout pairing a big address block with a live-looking map panel",
  },
  {
    slug: "review-28",
    title: "Neon Contact",
    desc: "Black backdrop with lime neon accents, phone number and website front and center",
  },
  {
    slug: "review-29",
    title: "Split CTA",
    desc: "Navy header over twin Call and Visit action panels with a review strip between",
  },
  {
    slug: "review-30",
    title: "Callout Rotator",
    desc: "Split call panel and Google reviews panel with an auto-rotating testimonial and QR footer",
  },
  {
    slug: "review-26",
    title: "Location & Testimonial",
    desc: "Warm cream address block beside a dark map panel with a pinned location and review card",
  },
  {
    slug: "review-31",
    title: "Neon Rotator",
    desc: "Dark amber-neon split screen with a giant domain name beside auto-rotating Google reviews",
  },
  {
    slug: "review-23",
    title: "Portrait",
    desc: "Full-bleed reviewer portrait beside a warm serif pull-quote and contact footer",
  },
  {
    slug: "review-27",
    title: "Location Rotator",
    desc: "Deep green law-office billboard with a vertical monogram sidebar and rotating review strip",
  },
  {
    slug: "review-32",
    title: "Full Billboard",
    desc: "Bold blue header with a giant domain name, amenities row, and an auto-rotating review strip",
  },
  {
    slug: "review-33",
    title: "Lantern Pilates Board",
    desc: "Studio hero with three glowing contact cards and a review band below",
  },
  {
    slug: "review-34",
    title: "Vantage Reviews Board",
    desc: "Bold blue backdrop with an auto-rotating coverflow review carousel and contact bar",
  },
  {
    slug: "review-35",
    title: "Everything Online",
    desc: "Giant blinking-cursor domain over a browser-window screenshot with floating review cards",
  },
  {
    slug: "review-36",
    title: "You Are Here",
    desc: "Giant address with a live clock, storefront photo, and rotating Google reviews",
  },
];
