import island from "@/2d_assets/First Island/Tiled/Tiled_map.png";
import church from "@/2d_assets/Church/Maps/Ruined_temple_exterior.png";

// Adding a destination here updates both the atlas and the home page.
export const learningWorlds = [
  { id: "first-island", name: "The First Island", topic: "5 Python topics", description: "Choose your topic and difficulty, follow the island guides, and take the Scout’s trial.", href: "/game", image: island, art: "island", label: "Easy · Medium · Hard" },
  { id: "church", name: "The Chapel of Choices", topic: "5 Python topics", description: "Choose what to learn, enter the sanctuary, and put your understanding to the Keeper’s test.", href: "/game/church", image: church, art: "church", label: "Easy · Medium · Hard" },
] as const;
