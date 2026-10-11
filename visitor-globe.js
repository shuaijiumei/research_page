import createGlobe from "./assets/vendor/cobe-2.0.1.js";

const canvas = document.getElementById("visitor-globe");
const count = document.getElementById("visitor-count");
const globe = createGlobe(canvas, {
  devicePixelRatio: 2,
  width: 360,
  height: 360,
  phi: 0,
  theta: 0.2,
  dark: 0,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.3, 0.38, 0.48],
  markerColor: [0.83, 0.65, 0.38],
  glowColor: [0.96, 0.96, 0.96],
  markers: [],
});

function rotate(time) {
  globe.update({ phi: time * 0.00012 });
  requestAnimationFrame(rotate);
}
requestAnimationFrame(rotate);

// Google's DSPL country coordinates; markers represent countries, not cities.
const centersResponse = await fetch("./data/country-centers.json");
if (!centersResponse.ok) throw new Error(`Country coordinates: ${centersResponse.status}`);
const centers = await centersResponse.json();

async function refreshVisitors() {
  const response = await fetch("https://feed-pulse.com/api/public/site/boyintan.com");
  if (!response.ok) throw new Error(`Visitor statistics: ${response.status}`);
  const stats = await response.json();
  const countries = stats.countries.filter((country) => centers[country.country_code]);
  globe.update({
    markers: countries.map((country) => ({
      location: centers[country.country_code],
      size: Math.min(0.12, 0.035 + Math.log1p(country.count) * 0.012),
    })),
  });
  count.textContent = `${stats.total_visits} visits · ${countries.length} ${countries.length === 1 ? "country" : "countries"}`;
  count.title = `Since ${new Date(stats.since).toLocaleDateString("en")}`;
  canvas.setAttribute("aria-label", `Rotating globe of visitor countries: ${countries.map((country) => `${country.country_name}: ${country.count}`).join(", ")}`);
}

// Wait for collection so the first stats read includes this page's visit.
function reportStatsError(error) {
  count.textContent = "Visitor statistics unavailable";
  console.error(error);
}
await document.getElementById("visitor-tracker").decode().then(refreshVisitors).catch(reportStatsError);
setInterval(() => refreshVisitors().catch(reportStatsError), 30000);
