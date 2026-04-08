const ADJECTIVES = ["Blazing", "Neon", "Phantom", "Crimson", "Silent", "Rogue", "Ember", "Feral", "Viper", "Ashen"];
const NOUNS      = ["Fox", "Hawk", "Wolf", "Raven", "Lynx", "Drake", "Crow", "Viper", "Ghost", "Shade"];

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
    return `${randomFrom(ADJECTIVES)}${randomFrom(NOUNS)}`;
}

const STORAGE_KEY = "flare_player_name";

export function getPlayerName(): string {
    let name = sessionStorage.getItem(STORAGE_KEY);
    if (!name) {
        name = generateName();
        sessionStorage.setItem(STORAGE_KEY, name);
    }
    return name;
}
