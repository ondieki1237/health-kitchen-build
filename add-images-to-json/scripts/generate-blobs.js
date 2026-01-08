import fs from "fs"
import path from "path"

const colorMap = {
  salad: "#dcfce7",
  spinach: "#dcfce7",
  okra: "#dcfce7",
  vegetable: "#f0fdf4",
  vegetarian: "#f0fdf4",
  vegan: "#f0fdf4",
  pesto: "#dcfce7",
  avocado: "#dcfce7",
  tomato: "#fef2f2",
  spicy: "#fee2e2",
  pizza: "#fff7ed",
  beef: "#ffe4e6",
  mince: "#ffe4e6",
  sausage: "#ffe4e6",
  red: "#fef2f2",
  curry: "#fed7aa",
  carrot: "#fff7ed",
  pumpkin: "#fed7aa",
  butternut: "#fed7aa",
  soup: "#fef3c7",
  stew: "#fed7aa",
  lentil: "#fef3c7",
  samosa: "#fef08a",
  rice: "#f8fafc",
  potato: "#fef3c7",
  cheese: "#fef3c7",
  creamy: "#f5f5f4",
  coconut: "#f8fafc",
  garlic: "#f9fafb",
  tofu: "#f5e6d3",
  oatmeal: "#f5e6d3",
  mushroom: "#e7e5e4",
  beans: "#fed7aa",
  fried: "#fef3c7",
  stirfry: "#fff7ed",
  roasted: "#fed7aa",
  peanut: "#fbd38d",
  groundnut: "#fbd38d",
  eggplant: "#e9d5ff",
  berry: "#ffe4e6",
}

// SVG blob template with unique path for each category
const generateBlobSVG = (color, label) => {
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${label}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <path d="M150,50 C180,80 190,130 160,170 C130,200 70,200 40,170 C10,140 20,60 50,40 C80,20 120,20 150,50 Z" fill="url(#grad-${label})" stroke="none"/>
</svg>`
}

const publicDir = path.join(process.cwd(), "public", "blobs")

// Create blobs directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true })
  console.log(`Created directory: ${publicDir}`)
}

// Generate SVG files for each food category
Object.entries(colorMap).forEach(([label, color]) => {
  const svg = generateBlobSVG(color, label)
  const filePath = path.join(publicDir, `${label}-blob.svg`)
  fs.writeFileSync(filePath, svg)
  console.log(`Generated: ${label}-blob.svg`)
})

console.log(`\nBlob images generated in: public/blobs/`)
