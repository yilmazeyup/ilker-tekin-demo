/** Drinks a client can order to her chair. A demo menu: the salon's real drinks are not on its site. */
export type DrinkId = 'cappuccino' | 'espresso' | 'latte' | 'thee' | 'muntthee' | 'chai' | 'water' | 'bruiswater';

export type Drink = { id: DrinkId; name: string; line: string; minutes: number; hot: boolean };

export const DRINKS: Drink[] = [
  { id: 'cappuccino', name: 'Cappuccino', line: 'Dubbele shot, romig melkschuim', minutes: 3, hot: true },
  { id: 'latte', name: 'Latte macchiato', line: 'Veel melk, zacht en warm', minutes: 3, hot: true },
  { id: 'espresso', name: 'Espresso', line: 'Kort en krachtig', minutes: 2, hot: true },
  { id: 'chai', name: 'Chai latte', line: 'Kaneel, kardemom, gember', minutes: 4, hot: true },
  { id: 'muntthee', name: 'Verse muntthee', line: 'Met verse munt en honing', minutes: 4, hot: true },
  { id: 'thee', name: 'Thee', line: 'Groene of zwarte thee', minutes: 3, hot: true },
  { id: 'water', name: 'Water', line: 'Plat, met citroen', minutes: 1, hot: false },
  { id: 'bruiswater', name: 'Bruisend water', line: 'Met een schijfje limoen', minutes: 1, hot: false },
];

export const drinkById = (id: DrinkId) => DRINKS.find((d) => d.id === id)!;
