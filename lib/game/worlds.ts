import island from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import church from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";

// Adding a destination here updates both the atlas and the home page.
export const learningWorlds = [
  { id: "first-island", name: "The First Island", topic: "Variables & values", description: "Meet the island teachers and take on the Scout’s coding trial.", href: "/game", image: island, art: "island", label: "Learning adventure" },
  { id: "church", name: "The Chapel of Choices", topic: "Conditions", description: "Enter the forgotten sanctuary and solve its sequence of Python choices.", href: "/game/church", image: church, art: "church", label: "Conditions adventure" },
] as const;
