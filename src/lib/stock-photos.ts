import lake from "@/assets/catalog/photo-lake.jpg.asset.json";
import city from "@/assets/catalog/photo-city.jpg.asset.json";
export const PHOTO_STOCK = [
  {
    "id": "photo-lake",
    "title": "Lago entre montañas · fotografía",
    "titleEn": "Mountain lake · photograph",
    "category": "Naturaleza y paisajes",
    "categoryEn": "Nature & landscapes",
    "keywords": [
      "photo",
      "foto",
      "Lago entre montañas · fotografía",
      "Mountain lake · photograph"
    ],
    "w": 1400,
    "h": 933,
    "svg": "",
    "kind": "photo",
    "license": "CC0 1.0",
    "source": "https://commons.wikimedia.org/wiki/File:Lake_Mountain_Landscape.jpg",
    "author": "Bonnie Moreland"
  },
  {
    "id": "photo-city",
    "title": "Arquitectura en Ciudad de México · fotografía",
    "titleEn": "Mexico City architecture · photograph",
    "category": "Arquitectura y ciudades",
    "categoryEn": "Architecture & cities",
    "keywords": [
      "photo",
      "foto",
      "Arquitectura en Ciudad de México · fotografía",
      "Mexico City architecture · photograph"
    ],
    "w": 640,
    "h": 480,
    "svg": "",
    "kind": "photo",
    "license": "CC0 1.0",
    "source": "https://commons.wikimedia.org/wiki/File:Old_architecture_Mexico_City.jpg",
    "author": "Pvt.Billinghurst"
  }
] .map((s, i) => ({ ...s, url: i === 0 ? lake.url : city.url }));
