export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  keywords: string;
  paragraphs: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "improve-soil-fertility-rwanda",
    title: "5 Practical Ways to Improve Soil Fertility on Rwandan Farms",
    description:
      "How Rwandan farmers can improve soil fertility with soil tests, organic matter, crop rotation, and AgriSense crop recommendations.",
    date: "2026-07-20",
    image: "/assets/serviceImages/Soil-And-Crop-Analysis.png",
    keywords: "soil fertility Rwanda, soil analysis, crop recommendations, AgriSense",
    paragraphs: [
      "Healthy soil is the difference between a thin harvest and a season you can plan around. In Rwanda — from volcanic soils in the north-west to clay and loam in the east — fertility changes field by field. Guessing fertilizer or planting the same crop every year often wastes money and weakens the land.",
      "Start with a soil check. Even a basic reading of pH, moisture, and texture tells you whether lime, compost, or a different crop will pay off. AgriSense soil and crop analysis turns those signals into a crop suggestion matched to your farm, not a generic national average.",
      "Add organic matter whenever you can: compost, manure, and crop residues hold water in the dry months and feed microbes that release nutrients slowly. Combine that with rotation — for example maize followed by beans — so one crop does not strip the same nutrients season after season.",
      "Time fertilizer to weather and growth stage, not to habit. Heavy rain after broadcasting urea can wash nutrients downhill. Live weather on AgriSense helps you pick a safer window and avoid irrigating or spraying when a storm is coming.",
      "Finally, keep notes. Record what you planted, what you applied, and what you harvested. Over two seasons those notes become your own fertility map — and that is how small farms in Nyabihu and beyond move from hope to a repeatable plan.",
    ],
  },
  {
    slug: "weather-and-crop-yields-rwanda",
    title: "How Weather Patterns Shape Crop Yields in Rwanda",
    description:
      "Understand rainfall, drought, and frost risk in Rwanda, and how hyperlocal farm weather alerts protect seedlings and harvests.",
    date: "2026-07-28",
    image: "/assets/serviceImages/WeatherAndClimate.png",
    keywords: "Rwanda farm weather, rainfall forecast farmers, crop yields, AgriSense weather",
    paragraphs: [
      "Rwanda’s two rainy seasons and two dry seasons set the calendar for maize, beans, potatoes, and tea. A late start to the rains, a dry spell in the middle of vegetative growth, or a sudden hailstorm can erase weeks of work. National forecasts help — but a valley in Nyabihu does not always match Kigali’s sky.",
      "Yield is mostly water, temperature, and timing. Too little rain at flowering cuts grain fill. Too much rain at harvest raises rot and drying costs. Heat on young seedlings stresses roots. Frost in higher hills can kill nightshade and potato leaves overnight.",
      "AgriSense weather monitoring is built for the field: temperature, humidity, wind, and a short outlook you can act on. Advisories flag irrigation, drought, heat, and frost so you can cover seedlings, delay spraying, or harvest a day early.",
      "Use weather together with crop choice. A variety that needs a long wet season will fail if the rains shorten. Pair the forecast with AgriSense crop recommendations so you plant what the season — and your soil — can actually support.",
      "Share alerts with your cooperative. One phone with a timely warning can protect many plots. That is how weather stops being a rumour in the market and becomes a daily farm tool.",
    ],
  },
  {
    slug: "smart-irrigation-save-water",
    title: "Smart Irrigation: Save Water and Protect Growth",
    description:
      "Irrigation tips for Rwandan farms: water when soil and weather say so, reduce waste, and protect yield with AgriSense scheduling.",
    date: "2026-08-04",
    image: "/assets/smartFarmingImage.webp",
    keywords: "smart irrigation Rwanda, water saving farming, soil moisture, AgriSense",
    paragraphs: [
      "Water is scarce in the dry season and precious after a dry spell in the rains. Over-watering wastes fuel and leaches fertilizer. Under-watering at flowering costs yield you cannot recover later.",
      "Smart irrigation means watering from soil moisture and the next rain, not from a fixed calendar. If AgriSense shows rain within 24 hours, skip the pump. If soil is dry and a heat spike is coming, water early morning so less evaporates.",
      "Drip and watering cans at the root zone beat flooding the whole bed. Mulch with grass or residues to keep moisture in. Group crops with similar water needs so one schedule does not drown one plant and starve another.",
      "On hillsides, irrigate in short pulses so water soaks in instead of running off. Combine that with AgriSense farm management so each plot’s size and crop is on record — then irrigation advice matches the field you are standing in.",
      "Start small: one bed, one week of notes (date, hours, weather, how the plants looked). You will see quickly whether you can cut water without cutting growth. That habit scales from a kitchen garden to a full hectare.",
    ],
  },
];

export function getBlogPost(slug: string) {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
