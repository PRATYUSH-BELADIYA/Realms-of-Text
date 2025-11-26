import React, { useState, useEffect, useRef } from 'react';
import {
    Sword, Shield, Heart, Map, ShoppingBag,
    Hammer, Skull, Gift, ArrowRight, Home,
    Coins, User, MessageSquare, Save,
    Backpack, Sparkles, Zap, Flame, Scroll, CheckCircle,
    Droplets, Cloud, Layers, Hexagon, Feather, Gem,
    Beer, Dices, Crown, AlertTriangle, HelpCircle, FlaskConical, Swords, Clock
} from 'lucide-react';
import { supabase, saveToCloud, loadFromCloud } from "../supabase";   // ADD THIS


import warrior from '../assets/warrior.png';
import rogue from '../assets/rogue.png';
import mage from '../assets/mage.png';

import warrior_hover from '../assets/warrior_hover.png';
import rogue_hover from '../assets/rouge_hover.png';
import mage_hover from '../assets/mage_hover.png';

// --- Game Data & Constants ---

const CLASSES = {
    warrior: {
        id: 'warrior', name: 'Warrior', hpBonus: 50, manaBonus: 10, dmgBonus: 2, defBonus: 3, critChance: 0.05,
        desc: 'High Defense & Health.', icon: '🛡️', image: warrior,
        skills: [
            { id: 'slam', name: 'Heavy Slam', level: 1, cost: 0, cd: 0, dmgMult: 1.2, desc: 'Strong basic attack' },
            { id: 'bash', name: 'Shield Bash', level: 3, cost: 15, cd: 3, dmgMult: 1.5, desc: 'Dmg + Block 80% next hit', effect: 'block' },
            { id: 'execute', name: 'Execute', level: 7, cost: 30, cd: 5, dmgMult: 3.0, desc: 'Massive damage strike' }
        ]
    },
    rogue: {
        id: 'rogue', name: 'Rogue', hpBonus: 10, manaBonus: 20, dmgBonus: 4, defBonus: 0, critChance: 0.20,
        desc: 'High Crit & Speed.', icon: '🗡️', image: rogue,
        skills: [
            { id: 'stab', name: 'Quick Stab', level: 1, cost: 0, cd: 0, dmgMult: 1.1, desc: 'Fast low-cost attack' },
            { id: 'shadow', name: 'Shadow Strike', level: 3, cost: 20, cd: 3, dmgMult: 2.0, desc: 'Guaranteed Critical Hit', effect: 'crit' },
            { id: 'assassinate', name: 'Assassinate', level: 7, cost: 40, cd: 4, dmgMult: 3.5, desc: 'Deadly precision attack' }
        ]
    },
    mage: {
        id: 'mage', name: 'Mage', hpBonus: -10, manaBonus: 60, dmgBonus: 8, defBonus: -1, critChance: 0.10,
        desc: 'Burst Magic Damage.', icon: '', image: mage,
        skills: [
            { id: 'bolt', name: 'Arcane Bolt', level: 1, cost: 0, cd: 0, dmgMult: 1.3, desc: 'Basic magic missile' },
            { id: 'fireball', name: 'Fireball', level: 3, cost: 25, cd: 3, dmgMult: 2.2, desc: 'High fire damage' },
            { id: 'meteor', name: 'Meteor', level: 7, cost: 50, cd: 5, dmgMult: 4.0, desc: 'Ultimate destruction' }
        ]
    }
};

const LOCATIONS = [
    { id: 'town', name: 'Riverwood Town', type: 'safe', difficulty: 0, desc: 'The bustling capital. Traders and heroes meet here.', boss: null },
    { id: 'forest', name: 'Whispering Forest', type: 'danger', difficulty: 1, desc: 'Trees block the sun. Goblins lurk here.', boss: 'Broodmother Spider' },
    { id: 'cave', name: 'Crystal Cave', type: 'danger', difficulty: 3, desc: 'Dark and damp. Echoes of wolves and bears.', boss: 'Crystal Golem' },
    { id: 'dungeon', name: 'Shadow Dungeon', type: 'danger', difficulty: 5, desc: 'An ancient ruin filled with elite undead.', boss: 'Lich King' },
    { id: 'mountain', name: 'Dragon Peak', type: 'danger', difficulty: 8, desc: 'The air is thin and hot. Dragons nest here.', boss: 'Infernal Dragon' }
];

const ENCHANTMENTS = {
    weapon: [
        { id: 'sharp', name: 'Sharp', bonus: 'dmg', val: 3, desc: '+3 Dmg' },
        { id: 'flaming', name: 'Flaming', bonus: 'dmg', val: 5, desc: '+5 Fire Dmg' },
        { id: 'vampiric', name: 'Vampiric', bonus: 'lifesteal', val: 0.1, desc: 'Heal 10% of Dmg' },
        { id: 'lucky', name: 'Lucky', bonus: 'crit', val: 0.1, desc: '+10% Crit Chance' }
    ],
    armor: [
        { id: 'sturdy', name: 'Sturdy', bonus: 'def', val: 2, desc: '+2 Def' },
        { id: 'blessed', name: 'Blessed', bonus: 'hp', val: 20, desc: '+20 Max HP' },
        { id: 'arcane', name: 'Arcane', bonus: 'mana', val: 20, desc: '+20 Max Mana' },
        { id: 'spiked', name: 'Spiked', bonus: 'thorns', val: 3, desc: 'Return 3 Dmg on hit' }
    ]
};

const SHOP_ITEMS = [
    { id: 'potion', name: 'Health Potion', type: 'consumable', cost: 50, value: 50, desc: 'Restores 50 HP' },
    { id: 'mana_potion', name: 'Mana Potion', type: 'consumable', cost: 40, value: 40, desc: 'Restores 40 MP' },
    { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', cost: 150, damage: 5, desc: '+5 Dmg', classReq: 'all' },
    { id: 'leather_armor', name: 'Leather Armor', type: 'armor', cost: 100, defense: 3, desc: '+3 Def', classReq: 'all' },
    // Warrior
    { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', cost: 400, damage: 12, desc: '+12 Dmg', classReq: 'warrior' },
    { id: 'great_axe', name: 'Great Axe', type: 'weapon', cost: 650, damage: 18, desc: '+18 Dmg', classReq: 'warrior' },
    { id: 'chainmail', name: 'Chainmail', type: 'armor', cost: 350, defense: 8, desc: '+8 Def', classReq: 'warrior' },
    { id: 'plate_mail', name: 'Plate Mail', type: 'armor', cost: 600, defense: 14, desc: '+14 Def', classReq: 'warrior' },
    // Rogue
    { id: 'quick_dagger', name: 'Quick Dagger', type: 'weapon', cost: 350, damage: 10, desc: '+10 Dmg', classReq: 'rogue' },
    { id: 'dual_daggers', name: 'Dual Daggers', type: 'weapon', cost: 600, damage: 16, desc: '+16 Dmg', classReq: 'rogue' },
    { id: 'thief_garb', name: 'Thief Garb', type: 'armor', cost: 300, defense: 6, desc: '+6 Def', classReq: 'rogue' },
    { id: 'assassin_tunic', name: 'Assassin Tunic', type: 'armor', cost: 550, defense: 10, desc: '+10 Def', classReq: 'rogue' },
    // Mage
    { id: 'oak_wand', name: 'Oak Wand', type: 'weapon', cost: 400, damage: 14, desc: '+14 Dmg', classReq: 'mage' },
    { id: 'elder_staff', name: 'Elder Staff', type: 'weapon', cost: 700, damage: 22, desc: '+22 Dmg', classReq: 'mage' },
    { id: 'apprentice_robe', name: 'Apprentice Robe', type: 'armor', cost: 250, defense: 4, desc: '+4 Def', classReq: 'mage' },
    { id: 'silk_robes', name: 'Silk Robes', type: 'armor', cost: 450, defense: 7, desc: '+7 Def', classReq: 'mage' },
];

const ITEM_IMAGES = {
    // --- CONSUMABLES ---
    'Health Potion': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/tx66dzspb8v44e2jmu8re9kp7hlr',
    'Mana Potion': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/5h4wv0luygzm46240ufs47xsvsm5',
    'Elixir of Strength': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/8awohrxibxp5ro28pga69aylp3tx',
    'Stoneskin Brew': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/q8nbh6s7lpyapjj9ba35jv8llzaa',

    // --- STARTER GEAR ---
    'Rusty Dagger': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/cfgtqt7yokq3mu4g5984k2flf1gy',
    'Cloth Shirt': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/w2z92jlud89afmlfbrsrbykapbn8',

    // --- COMMON SHOP GEAR ---
    'Iron Sword': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/8mfwodbxtzij04svv0p8atljihj2',
    'Leather Armor': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/zyfaxvok6m4qohaztipjesmxzfbg',

    // --- WARRIOR GEAR ---
    'Steel Sword': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/ko4dnnj44tos8h69snm95bf5st3l',
    'Great Axe': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/yg8zzfzvxhqeevrzqlo8iyx0040q',
    'Chainmail': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/mk78jcn6fk18uy0vke022sx7cia5',
    'Plate Mail': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/60xd45ok60hk9azh59fkqbcqfmsr',

    // --- ROGUE GEAR ---
    'Quick Dagger': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/rss28vy3xhr9qvs4szege1casw1o',
    'Dual Daggers': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/zup74njbhcgpkrngn5now0p92872',
    'Thief Garb': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/bmnpx4mscka77lyum71zqgqvruil',
    'Assassin Tunic': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/szjmomij0h6n72jtjg9gftziddkt',

    // --- MAGE GEAR ---
    'Oak Wand': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/wdp7rd1cyehmiyh3r8hswho8z2io',
    'Elder Staff': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/7ce6fwxcdmh7hhl2s2jgpjwv9xix',
    'Apprentice Robe': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/iybuxzqlm5rcon194vzuuprcwnam',
    'Silk Robes': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/osbtfbnw8ksktmitem061gcwzx4h',

    // --- MONSTER DROPS / INGREDIENTS ---
    'Slime Gel': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/91lysdtefdeihicf66m1ffng26t6',
    'Goblin Ear': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/6l6a5uvtirvnsw29f690r3xgsdw6',
    'Wolf Pelt': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/1o164zvz47wjskqrn1foawgfp5yz',
    'Bone Dust': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/r1wrefouyeakykap24hx109zj0gn',
    'Orc Tusk': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/mt1nwnd9gl0wjqv5emfnz2myr45b',
    'Dragon Scale': 'https://www.vhv.rs/dpng/d/440-4402283_dragon-scale-png-dragon-scales-transparent-png-png.png',

    // --- EVENT IMAGES (Optional) ---
    'shrine': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/tciv4rch0j897rk1youz516dzii1',
    'wagon': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/esccp5hm2c42xqfhcd6x5pxpeuk8',
    'spring': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/wf5ym5cl4bvwbtlyqwhcp6pxjvz9',

    'Epic Broodmother Blade': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/sp7ftos2kx0lqn0tootnx54yzzim', // Looks like a green/poison dagger
    'Epic Broodmother Plate': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/0cx701mdaj9qli2gwb4yqjw1omri', // Placeholder (Paste a Green Armor URL here)

    // CAVE BOSS (Crystal Golem)
    'Epic Crystal Blade': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/cunucufjqwi178302potmhf9pxhq', // Placeholder (Paste a Blue Crystal Sword URL here)
    'Epic Crystal Plate': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/mxrujoen4jt5nojhmmqdchac2o0c', // Looks like shiny plate armor

    // DUNGEON BOSS (Lich King)
    'Epic Lich Blade': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/mlfs8jjvh5c9dir4ao3l626n2hde', // Looks like a dark staff/blade
    'Epic Lich Plate': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/95km2zmw05wsq2mkc0m8fv1hf8nm', // Looks like dark chainmail

};

const ENEMY_IMAGES = {
    // --- STANDARD ENEMIES ---
    'Slime': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/pj3rtwojgwg95g8oz0po6pn86bqs',
    'Goblin': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/jw2aw4843cw4y5uad6dkdbkd0glr',
    'Wolf': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/o0fchb4gphxvalsxhrinrf09es9n',
    'Skeleton': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/w4wtynmu5sprxaw8ll6bst4hd51a',
    'Orc': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/vs5pv7ohhqztk5ux0p4omig0im3s',
    'Dragon Whelp': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/plqpfhzfgrqi7blgkytfqs07mctg',

    // --- BOSSES ---
    'Broodmother Spider': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/t2lgk7buvqax8qh6x6qosfj935vj',
    'Crystal Golem': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/rfctdbxawpaq90cxc1fp7c5tutet',
    'Lich King': 'https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/iqyxi21lsvpjw763z0uokrnqew2y',
};

const CRAFTING_RECIPES = [
    { name: 'Health Potion', type: 'potion', cost: 10, ingredients: [{ name: 'Slime Gel', count: 2 }], result: 'potion' },
    { name: 'Mana Potion', type: 'potion', cost: 10, ingredients: [{ name: 'Bone Dust', count: 2 }], result: 'mana_potion' },
    { name: 'Elixir of Strength', type: 'stat', cost: 300, ingredients: [{ name: 'Wolf Pelt', count: 3 }, { name: 'Orc Tusk', count: 1 }], result: 'dmg', bonus: 5, desc: 'Permanent +5 Damage' },
    { name: 'Stoneskin Brew', type: 'stat', cost: 300, ingredients: [{ name: 'Slime Gel', count: 5 }, { name: 'Dragon Scale', count: 1 }], result: 'def', bonus: 5, desc: 'Permanent +5 Defense' },
];

const ENEMY_TYPES = [
    { name: 'Slime', baseHp: 20, baseDmg: 3, exp: 10, drop: { name: 'Slime Gel', value: 5, chance: 0.5 } },
    { name: 'Goblin', baseHp: 35, baseDmg: 5, exp: 20, drop: { name: 'Goblin Ear', value: 12, chance: 0.4 } },
    { name: 'Wolf', baseHp: 50, baseDmg: 8, exp: 35, drop: { name: 'Wolf Pelt', value: 25, chance: 0.6 } },
    { name: 'Skeleton', baseHp: 60, baseDmg: 10, exp: 45, drop: { name: 'Bone Dust', value: 15, chance: 0.5 } },
    { name: 'Orc', baseHp: 100, baseDmg: 15, exp: 80, drop: { name: 'Orc Tusk', value: 40, chance: 1.3 } },
    { name: 'Dragon Whelp', baseHp: 200, baseDmg: 25, exp: 200, drop: { name: 'Dragon Scale', value: 150, chance: 1.0 } },
];

const ENEMY_PREFIXES = [
    { name: 'Weak', hpMod: 0.7, dmgMod: 0.8, expMod: 0.7 },
    { name: 'Fierce', hpMod: 1.2, dmgMod: 1.2, expMod: 1.3 },
    { name: 'Ancient', hpMod: 1.5, dmgMod: 1.1, expMod: 1.6 },
    { name: 'Rabid', hpMod: 0.8, dmgMod: 1.5, expMod: 1.4 },
    { name: 'Giant', hpMod: 2.0, dmgMod: 0.9, expMod: 1.8 },
    { name: 'Armored', hpMod: 1.3, dmgMod: 0.8, expMod: 1.3 },
];

const EXPLORATION_EVENTS = [
    {
        id: 'shrine',
        title: 'Forgotten Shrine',
        desc: 'You find a mossy statue humming with faint energy.',
        image: 'shrine',
        choices: [
            { text: 'Pray (Heal)', type: 'heal', val: 50, chance: 1.0, result: 'Warmth fills you. (+50 HP)' },
            { text: 'Steal Offering (Gold)', type: 'gold', val: 40, chance: 0.6, result: 'You snatched the gold!', fail: { type: 'damage', val: 20, msg: 'The statue zaps you! (-20 HP)' } },
            { text: 'Ignore', type: 'leave', result: 'You walk away.' }
        ]
    },
    {
        id: 'wagon',
        title: 'Overturned Wagon',
        desc: 'It looks abandoned, but you hear rustling nearby.',
        image: 'wagon',
        choices: [
            { text: 'Search Carefully', type: 'item', chance: 0.7, result: 'You found a potion!', fail: { type: 'combat', msg: 'A Goblin jumps out!' } },
            { text: 'Leave', type: 'leave', result: 'Better safe than sorry.' }
        ]
    },
    {
        id: 'spring',
        title: 'Glowing Spring',
        desc: 'The water glows with a magical blue hue.',
        image: 'spring',
        choices: [
            { text: 'Drink (Mana)', type: 'mana', val: 100, chance: 1.0, result: 'Your mind clears. (+100 MP)' },
            { text: 'Bottle it', type: 'item_mana', chance: 1.0, result: 'You filled a bottle. (+1 Mana Potion)' }
        ]
    }
];

const TOWN_EVENTS = [
    { text: "You help a merchant fix his cart.", reward: { type: 'gold', val: 20 }, msg: "He tips you 20 Gold." },
    { text: "A pickpocket bumps into you!", reward: { type: 'lose_gold', val: 15 }, msg: "You lost 15 Gold!" },
    { text: "You listen to rumors at the fountain.", reward: { type: 'xp', val: 10 }, msg: "You learned about the world. (+10 XP)" },
    { text: "You find a lucky coin on the ground.", reward: { type: 'gold', val: 50 }, msg: "It's your lucky day! (+50 Gold)" },
    { text: "A priest blesses you.", reward: { type: 'heal', val: 20 }, msg: "You feel refreshed. (+20 HP)" }
];

// NEW: Specific events for Wilderness (Forest, Cave, etc.)
const WILD_EVENTS = [
    { text: "You find an abandoned campfire.", reward: { type: 'item', val: 'potion' }, msg: "Someone left a Health Potion!" },
    { text: "You step into a hunter's trap!", reward: { type: 'damage', val: 15 }, msg: "Ouch! You take 15 damage." },
    { text: "You find a vein of rare ore.", reward: { type: 'gold', val: 40 }, msg: "You dig it out. (+40 Gold)" },
    { text: "A wandering minstrel sings a song.", reward: { type: 'xp', val: 25 }, msg: "You feel inspired. (+25 XP)" },
    { text: "You find a hidden fruit bush.", reward: { type: 'heal', val: 30 }, msg: "Delicious! (+30 HP)" }
];

// --- Components ---

export default function App({ initialPlayer }) {

    // --- State Management ---
    const [logs, setLogs] = useState([{ text: "Welcome to Realms of Text! Create your hero to begin.", type: 'system', id: 0 }]);
    const [gameState, setGameState] = useState('CLASS_SELECT');
    const [location, setLocation] = useState(LOCATIONS[0]);
    const [forgeMode, setForgeMode] = useState('UPGRADE'); // Options: 'UPGRADE' or 'ENCHANT'

    // Visual Effects State
    const [floatingTexts, setFloatingTexts] = useState([]); // { id, text, color, x, y }
    const [shake, setShake] = useState(false);

    const [player, setPlayer] = useState({
        class: null,
        level: 1,
        xp: 0,
        xpToNext: 100,
        hp: 100,
        maxHp: 100,
        mana: 50,
        maxMana: 50,
        gold: 50,
        damage: 5,
        defense: 0,
        critChance: 0.05,
        potions: 1,
        manaPotions: 1,
        inventory: [],
        activeQuests: [],
        completedQuests: 0,
        zoneProgress: {},
        cooldowns: {}, // { skillId: turnsRemaining }
        equipment: {
            weapon: { name: 'Rusty Dagger', type: 'weapon', damage: 2, level: 1, rarity: 'common' },
            armor: { name: 'Cloth Shirt', type: 'armor', defense: 1, level: 1, rarity: 'common' }
        }
    });
    useEffect(() => {
        if (initialPlayer) setPlayer(initialPlayer);   // load saved game
    }, [initialPlayer]);

    // Unique user ID (for saving/loading)
    const [userId] = useState(() => {
        const existing = localStorage.getItem("userId");
        if (existing) return existing;

        const newId = crypto.randomUUID();
        localStorage.setItem("userId", newId);
        return newId;
    });

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();  // refresh app to show login screen again
    };

    // --- CLOUD SAVE ---
    const saveToSupabase = async () => {
        const { data } = await supabase.auth.getUser();
        const email = data.user.email;    // USER EMAIL

        await saveToCloud(email, player);
        addLog("☁️ Saved to cloud!", "success");
    };


    // --- CLOUD LOAD ---
    // const loadFromSupabase = async () => {
    //   const data = await loadFromCloud(userId);
    //   if (data) {
    //     setPlayer(prev => ({ ...prev, ...data }));
    //     addLog("☁️ Loaded from cloud!", "success");
    //   } else {
    //     addLog("⚠ No cloud save found.", "warning");
    //   }
    // };


    // --- Derived Stats (Includes Enchants) ---
    const weaponEnchant = player.equipment.weapon.enchant;
    const armorEnchant = player.equipment.armor.enchant;

    const totalMaxHp = player.maxHp + (armorEnchant?.bonus === 'hp' ? armorEnchant.val : 0);
    const totalMaxMana = player.maxMana + (armorEnchant?.bonus === 'mana' ? armorEnchant.val : 0);
    const totalDmg = player.damage + player.equipment.weapon.damage + (weaponEnchant?.bonus === 'dmg' ? weaponEnchant.val : 0);
    const totalDef = player.defense + player.equipment.armor.defense + (armorEnchant?.bonus === 'def' ? armorEnchant.val : 0);
    const totalCrit = player.critChance + (weaponEnchant?.bonus === 'crit' ? weaponEnchant.val : 0);

    const [enemy, setEnemy] = useState(null);
    const [combatState, setCombatState] = useState({ defending: false });
    const [availableQuests, setAvailableQuests] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [arenaWave, setArenaWave] = useState(1);

    const logEndRef = useRef(null);

    // --- Local Storage Save/Load ---

    useEffect(() => {
        const savedData = localStorage.getItem('realms_rpg_save');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setPlayer(prev => ({
                    ...prev,
                    ...parsed,
                    activeQuests: parsed.activeQuests || [],
                    inventory: parsed.inventory || [],
                    equipment: parsed.equipment || prev.equipment,
                    zoneProgress: parsed.zoneProgress || {},
                    cooldowns: parsed.cooldowns || {}
                }));
                if (parsed.class) {
                    setGameState('IDLE');
                }
                addLog("💾 Game loaded from local storage.", "system");
            } catch (e) {
                console.error("Failed to load save", e);
            }
        }
    }, []);

    useEffect(() => {
        if (player.class) {
            localStorage.setItem('realms_rpg_save', JSON.stringify(player));
        }
    }, [player]);

    // --- Visual FX Helpers ---

    const addLog = (text, type = 'info') => {
        setLogs(prev => [...prev, { text, type, id: Date.now() + Math.random() }]);
    };

    useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

    const spawnFloatingText = (text, type = 'normal') => {
        const id = Date.now() + Math.random();
        const x = 40 + Math.random() * 20;
        const y = 40 + Math.random() * 20;
        let color = 'text-white';
        if (type === 'damage') color = 'text-red-400';
        if (type === 'crit') color = 'text-yellow-400 font-bold text-xl';
        if (type === 'heal') color = 'text-green-400';
        if (type === 'gold') color = 'text-yellow-300';

        setFloatingTexts(prev => [...prev, { id, text, color, x, y }]);
        setTimeout(() => {
            setFloatingTexts(prev => prev.filter(t => t.id !== id));
        }, 1000);
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 300);
    };

    // --- Game Logic Helpers ---

    useEffect(() => { if (player.xp >= player.xpToNext) levelUp(); }, [player.xp]);

    const levelUp = () => {
        const cls = CLASSES[player.class];
        setPlayer(prev => ({
            ...prev,
            level: prev.level + 1,
            xp: prev.xp - prev.xpToNext,
            xpToNext: Math.floor(prev.xpToNext * 1.5),
            maxHp: prev.maxHp + 20,
            hp: prev.maxHp + 20,
            maxMana: prev.maxMana + (cls ? cls.manaBonus / 2 : 5),
            mana: prev.maxMana + (cls ? cls.manaBonus / 2 : 5),
            damage: prev.damage + 2,
            defense: prev.defense + 1
        }));
        addLog(`🎉 LEVEL UP! You are now Level ${player.level + 1}! Stats Refreshed.`, 'success');
        spawnFloatingText("LEVEL UP!", "crit");
    };

    // Helper to calculate value of dynamic equipment
    const calculateItemValue = (item) => {
        if (item.value) return item.value; // Fixed value items (loot)
        // Calculate value based on stats for equipment
        const baseVal = item.rarity === 'epic' ? 500 : 50;
        const levelMult = (item.level || 1) * 20;
        const statMult = ((item.damage || 0) + (item.defense || 0)) * 10;
        return Math.floor(baseVal + levelMult + statMult);
    };

    
    const getItemImage = (name, rarity = 'common') => {

        if (ITEM_IMAGES[name]) {
            return ITEM_IMAGES[name];
        }

        // 2. Fallback: Generate the Emoji Card (Old System)
        const n = name.toLowerCase();
        let emoji = '📦';
        let bg = rarity === 'epic' ? '#581c87' : '#334155';

        if (n.includes('health') || (n.includes('potion') && !n.includes('mana'))) { emoji = '🧪'; bg = '#7f1d1d'; }
        else if (n.includes('mana')) { emoji = '⚗️'; bg = '#1e3a8a'; }

        // Weapons
        else if (n.includes('axe')) { emoji = '🪓'; if (rarity !== 'epic') bg = '#7f1d1d'; }
        else if (n.includes('wand') || n.includes('staff')) { emoji = '🪄'; if (rarity !== 'epic') bg = '#4338ca'; }
        else if (n.includes('dagger') || n.includes('blade')) { emoji = '🗡️'; if (rarity !== 'epic') bg = '#3f3f46'; }
        else if (n.includes('sword')) { emoji = '⚔️'; if (rarity !== 'epic') bg = '#3f3f46'; }

        // Armor
        else if (n.includes('robe') || n.includes('cloak')) { emoji = '👘'; if (rarity !== 'epic') bg = '#4338ca'; }
        else if (n.includes('tunic') || n.includes('garb')) { emoji = '🧥'; if (rarity !== 'epic') bg = '#065f46'; }
        else if (n.includes('plate') || n.includes('mail') || n.includes('armor')) { emoji = '🛡️'; if (rarity !== 'epic') bg = '#3f3f46'; }

        // Drops & Misc
        else if (n.includes('slime') || n.includes('gel')) { emoji = '🟢'; bg = '#14532d'; }
        else if (n.includes('bone') || n.includes('dust')) { emoji = '🦴'; bg = '#57534e'; }
        else if (n.includes('scale') || n.includes('gem')) { emoji = '💎'; bg = '#581c87'; }

        // Event Images
        if (n.includes('shrine')) { emoji = '⛩️'; bg = '#064e3b'; }
        if (n.includes('wagon')) { emoji = '🛒'; bg = '#451a03'; }
        if (n.includes('spring')) { emoji = '⛲'; bg = '#1e3a8a'; }

        const glow = rarity === 'epic' ? `<circle cx="50" cy="50" r="40" fill="none" stroke="#d8b4fe" stroke-width="5" opacity="0.5" />` : '';

        // Generate SVG Data URI
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="${bg}" rx="20" />
          ${glow}
          <text x="50" y="65" font-size="50" text-anchor="middle">${emoji}</text>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };

    // Helper to get glow styles based on enchantment ID
    const getEnchantGlow = (enchant) => {
        if (!enchant) return '';

        switch (enchant.id) {
            // --- WEAPONS ---
            case 'sharp': return 'shadow-[0_0_10px_#94a3b8] border-slate-400'; // Silver/Grey
            case 'flaming': return 'shadow-[0_0_15px_#f97316] border-orange-500'; // Bright Orange
            case 'vampiric': return 'shadow-[0_0_15px_#dc2626] border-red-600'; // Deep Red
            case 'lucky': return 'shadow-[0_0_15px_#fbbf24] border-yellow-400'; // Gold

            // --- ARMOR ---
            case 'sturdy': return 'shadow-[0_0_10px_#64748b] border-slate-500'; // Steel Blue
            case 'blessed': return 'shadow-[0_0_15px_#10b981] border-emerald-500'; // Green
            case 'arcane': return 'shadow-[0_0_15px_#06b6d4] border-cyan-500'; // Cyan/Magic
            case 'spiked': return 'shadow-[0_0_15px_#d946ef] border-fuchsia-500'; // Purple/Pink

            default: return '';
        }
    };

    const handleEnchant = (slot) => {
        if (player.gold < 200) {
            addLog("Need 200g to enchant.", 'error');
            return;
        }

        const options = ENCHANTMENTS[slot];
        const newEnchant = options[Math.floor(Math.random() * options.length)];

        setPlayer(prev => ({
            ...prev,
            gold: prev.gold - 200,
            equipment: {
                ...prev.equipment,
                [slot]: { ...prev.equipment[slot], enchant: newEnchant }
            }
        }));

        spawnFloatingText("✨ ENCHANTED", "crit");
        addLog(`Enchanted ${slot}! It is now ${newEnchant.name} (${newEnchant.desc}).`, 'success');
    };

    // --- Event System ---

    const triggerEvent = () => {
        const eventTemplate = EXPLORATION_EVENTS[Math.floor(Math.random() * EXPLORATION_EVENTS.length)];
        setActiveEvent(eventTemplate);
        setGameState('INTERACTIVE_EVENT');
        addLog(`You encountered a ${eventTemplate.title}.`, 'info');
    };

    const resolveEvent = (choice) => {
        const success = Math.random() < (choice.chance || 1.0);
        if (success) {
            setPlayer(prev => {
                let ns = { ...prev };
                if (choice.type === 'heal') { ns.hp = Math.min(totalMaxHp, ns.hp + choice.val); spawnFloatingText(`+${choice.val} HP`, 'heal'); }
                if (choice.type === 'mana') { ns.mana = Math.min(totalMaxMana, ns.mana + choice.val); spawnFloatingText(`+${choice.val} MP`, 'heal'); }
                if (choice.type === 'gold') { ns.gold += choice.val; spawnFloatingText(`+${choice.val} G`, 'gold'); }
                if (choice.type === 'item') ns.potions++;
                if (choice.type === 'item_mana') ns.manaPotions++;
                return ns;
            });
            addLog(choice.result, 'success');
            setGameState('IDLE');
        } else {
            if (choice.fail.type === 'damage') {
                setPlayer(p => ({ ...p, hp: Math.max(0, p.hp - choice.fail.val) }));
                spawnFloatingText(`-${choice.fail.val} HP`, 'damage');
                triggerShake();
                addLog(choice.fail.msg, 'danger');
                setGameState('IDLE');
            } else if (choice.fail.type === 'combat') {
                addLog(choice.fail.msg, 'warning');
                generateEnemy();
            } else {
                addLog("Nothing happened.", 'info');
                setGameState('IDLE');
            }
        }
        setActiveEvent(null);
    };

    // --- Quest System Helper ---
    const checkQuestCompletion = (killTarget = null) => {
        setPlayer(prev => {
            let newQuests = prev.activeQuests.map(q => {
                if (q.type === 'kill' && q.target === killTarget) {
                    return { ...q, current: q.current + 1 };
                }
                return q;
            });

            const completed = [];
            const ongoing = [];

            newQuests.forEach(q => {
                let isComplete = false;
                if (q.type === 'kill' && q.current >= q.required) isComplete = true;
                if (q.type === 'collect') {
                    const item = prev.inventory.find(i => i.name === q.target);
                    if (item && item.count >= q.required) isComplete = true;
                }

                if (isComplete) completed.push(q);
                else ongoing.push(q);
            });

            if (completed.length > 0) {
                let goldBonus = 0;
                let xpBonus = 0;
                let newInv = [...prev.inventory];

                completed.forEach(q => {
                    goldBonus += q.rewardGold;
                    xpBonus += q.rewardXp;
                    addLog(`✅ Quest Complete: ${q.type === 'kill' ? 'Hunt' : 'Gather'} ${q.target}! (+${q.rewardGold}G, +${q.rewardXp}XP)`, 'success');
                    spawnFloatingText(`+${q.rewardGold} G`, 'gold');

                    if (q.type === 'collect') {
                        const idx = newInv.findIndex(i => i.name === q.target);
                        if (idx >= 0) {
                            if (newInv[idx].count > q.required) newInv[idx].count -= q.required;
                            else newInv.splice(idx, 1);
                            addLog(`Handed over ${q.required} ${q.target}.`, 'info');
                        }
                    }
                });

                return {
                    ...prev,
                    gold: prev.gold + goldBonus,
                    xp: prev.xp + xpBonus,
                    activeQuests: ongoing,
                    completedQuests: prev.completedQuests + completed.length,
                    inventory: newInv
                };
            }

            return { ...prev, activeQuests: ongoing.concat(completed).filter(q => !completed.includes(q)).length > 0 ? newQuests : prev.activeQuests };
        });
    };

    // --- Combat System ---

    const generateEnemy = (mode = 'normal') => {
        const difficultyMod = location.difficulty;

        // Boss Fight Mode
        if (mode === 'boss') {
            setEnemy({
                name: location.boss,
                level: player.level + 4,
                maxHp: (player.level * 30) + 200,
                hp: (player.level * 30) + 200,
                damage: (player.level * 5) + 15,
                isBoss: true,
                isElite: true
            });
            setGameState('COMBAT');
            addLog(`☠️ BOSS FIGHT: ${location.boss} approaches!`, 'danger');
            return;
        }

        // Arena Mode
        if (mode === 'arena') {
            const typeIndex = Math.floor(Math.random() * ENEMY_TYPES.length);
            const template = ENEMY_TYPES[typeIndex];
            const arenaLevel = player.level + Math.floor(arenaWave / 2);

            setEnemy({
                ...template,
                name: `Arena ${template.name}`,
                level: arenaLevel,
                maxHp: template.baseHp + (arenaLevel * 15),
                hp: template.baseHp + (arenaLevel * 15),
                damage: template.baseDmg + (arenaLevel * 3),
                exp: (template.exp + (arenaLevel * 5)) * 2, // Double XP in arena
                isArena: true
            });
            setGameState('COMBAT');
            setCombatState({ defending: false });
            addLog(`⚔️ Arena Wave ${arenaWave}: Lvl ${arenaLevel} ${template.name} enters!`, 'warning');
            return;
        }

        // Normal Mode (Exploration)
        const hasPrefix = Math.random() > 0.5;
        const prefix = hasPrefix ? ENEMY_PREFIXES[Math.floor(Math.random() * ENEMY_PREFIXES.length)] : null;
        const isElite = player.level % 5 === 0 && Math.random() > 0.8;
        const scaledLevel = Math.max(1, player.level + (difficultyMod - 1));
        const typeIndex = Math.min(ENEMY_TYPES.length - 1, Math.floor(Math.random() * (difficultyMod + 2)));
        const template = ENEMY_TYPES[typeIndex];

        const hpMult = (prefix?.hpMod || 1) * (isElite ? 1.5 : 1);
        const dmgMult = (prefix?.dmgMod || 1) * (isElite ? 1.2 : 1);
        const expMult = (prefix?.expMod || 1) * (isElite ? 2 : 1);

        const enemyName = `${prefix ? prefix.name + ' ' : ''}${isElite ? 'Elite ' : ''}${template.name}`;

        setEnemy({
            ...template,
            name: enemyName,
            level: scaledLevel + (isElite ? 2 : 0),
            maxHp: Math.floor((template.baseHp + (scaledLevel * 10)) * hpMult),
            hp: Math.floor((template.baseHp + (scaledLevel * 10)) * hpMult),
            damage: Math.floor((template.baseDmg + (scaledLevel * 2)) * dmgMult),
            exp: Math.floor(template.exp * expMult) || 20,
            isElite
        });

        setGameState('COMBAT');
        setCombatState({ defending: false });
        addLog(`⚔️ A Lvl ${scaledLevel} ${enemyName} appears!`, isElite ? 'warning' : 'info');
    };

    const performAttack = (skill) => {
        if (!enemy) return;
        if (skill.level > player.level) { addLog(`Level ${skill.level} required!`, 'error'); return; }
        if (player.mana < skill.cost) { addLog("Not enough Mana!", 'warning'); return; }
        if (player.cooldowns[skill.id] > 0) { addLog("Skill on cooldown!", 'warning'); return; }

        setPlayer(p => ({ ...p, mana: p.mana - skill.cost, cooldowns: { ...p.cooldowns, [skill.id]: skill.cd } }));
        if (skill.effect === 'block') setCombatState(p => ({ ...p, defending: true }));

        // --- DAMAGE CALCULATION (Enchants included in totalDmg/totalCrit) ---
        const isGuaranteedCrit = skill.effect === 'crit';
        const isCrit = isGuaranteedCrit || (Math.random() < totalCrit);
        const critMult = isCrit ? 1.5 : 1;
        const finalDmg = Math.floor(totalDmg * skill.dmgMult * critMult * (0.9 + Math.random() * 0.2));

        // --- LIFESTEAL LOGIC ---
        if (weaponEnchant?.bonus === 'lifesteal') {
            const healAmt = Math.ceil(finalDmg * weaponEnchant.val);
            setPlayer(p => ({ ...p, hp: Math.min(totalMaxHp, p.hp + healAmt) }));
            spawnFloatingText(`+${healAmt}`, 'heal');
        }

        const remainingEnemyHp = enemy.hp - finalDmg;
        spawnFloatingText(finalDmg, isCrit ? 'crit' : 'normal');
        if (isCrit || skill.dmgMult > 1.5) triggerShake();
        addLog(`You used ${skill.name} for ${finalDmg} dmg${isCrit ? ' (CRIT!)' : ''}.`, 'info');

        if (remainingEnemyHp <= 0) winCombat();
        else {
            setEnemy(prev => ({ ...prev, hp: remainingEnemyHp }));
            setTimeout(enemyAttack, 600);
        }
    };

    const enemyAttack = () => {
        setEnemy(prevEnemy => {
            if (!prevEnemy) return null;

            let incomingDmg = Math.max(1, Math.floor(prevEnemy.damage - (totalDef * 0.5)));

            if (combatState.defending) {
                incomingDmg = Math.floor(incomingDmg * 0.2);
                addLog("🛡️ Shield Bash blocked most of the damage!", 'success');
                setCombatState(p => ({ ...p, defending: false }));
            }

            // --- THORNS LOGIC ---
            let thornDmg = 0;
            if (armorEnchant?.bonus === 'thorns') {
                thornDmg = armorEnchant.val;
            }

            setPlayer(prev => {
                const newCooldowns = { ...prev.cooldowns };
                for (let key in newCooldowns) if (newCooldowns[key] > 0) newCooldowns[key]--;

                const newHp = prev.hp - incomingDmg;
                if (newHp <= 0) { handleDeath(); return { ...prev, hp: 0 }; }
                return { ...prev, hp: newHp, mana: Math.min(totalMaxMana, prev.mana + 2), cooldowns: newCooldowns };
            });

            spawnFloatingText(`-${incomingDmg}`, 'damage');
            if (incomingDmg > totalMaxHp * 0.1) triggerShake();
            addLog(`${prevEnemy.name} attacks for ${incomingDmg} dmg!`, 'danger');

            if (thornDmg > 0) {
                spawnFloatingText(`${thornDmg}`, 'crit'); // Thorns visual
                addLog(`Spiked armor reflected ${thornDmg} damage!`, 'info');
                return { ...prevEnemy, hp: prevEnemy.hp - thornDmg };
            }

            return prevEnemy;
        });
    };

    const winCombat = () => {
        const goldReward = Math.floor((enemy.level * 10) * (1 + Math.random()) * (enemy.isBoss ? 5 : 1));
        const xpReward = (enemy.exp || 20) + (enemy.level * 5);

        let dropMsg = "";
        let newInventory = [...player.inventory];

        if (enemy.drop && Math.random() < enemy.drop.chance) {
            const dropItem = enemy.drop;
            const existingItemIndex = newInventory.findIndex(i => i.name === dropItem.name && i.rarity !== 'epic');
            if (existingItemIndex >= 0) newInventory[existingItemIndex].count += 1;
            else newInventory.push({ name: dropItem.name, value: dropItem.value, count: 1, rarity: 'common' });
            dropMsg = ` Found ${dropItem.name}!`;
        }

        if (enemy.isBoss) {
            const isWeapon = Math.random() > 0.5;
            const slot = isWeapon ? 'weapon' : 'armor';
            
            // Create the item object
            const newEpic = {
                name: isWeapon ? `Epic ${location.boss.split(' ')[0]} Blade` : `Epic ${location.boss.split(' ')[0]} Plate`,
                level: player.level,
                rarity: 'epic',
                type: slot,
                [slot === 'weapon' ? 'damage' : 'defense']: (slot === 'weapon' ? 10 : 5) + (player.level * 2),
                value: 500,  // Add value so it can be sold
                count: 1     // Add count so it works in inventory
            };

            // CHANGE: Message says "Found" instead of "Equipped"
            dropMsg += ` 🟣 BOSS DROP: Found ${newEpic.name}!`;

            // CHANGE: Push to inventory array instead of setting player equipment immediately
            newInventory.push(newEpic); 
        }

        // Update Zone Progress (Only for exploration)
        let newProgress = { ...player.zoneProgress };
        if (!location.id.includes('town') && !enemy.isArena) {
            const currentProg = newProgress[location.id] || 0;
            if (enemy.isBoss) {
                newProgress[location.id] = 0;
                addLog(`The ${location.name} is safe... for now.`, 'success');
            } else {
                newProgress[location.id] = Math.min(100, currentProg + 20);
            }
        }

        setPlayer(prev => ({
            ...prev,
            gold: prev.gold + goldReward,
            xp: prev.xp + xpReward,
            inventory: newInventory,
            mana: Math.min(totalMaxMana, prev.mana + 5),
            zoneProgress: newProgress
        }));

        spawnFloatingText(`+${goldReward} G`, 'gold');
        addLog(`Victory! +${goldReward} G, +${xpReward} XP.${dropMsg}`, 'success');

        // ARENA LOGIC
        if (enemy.isArena) {
            setArenaWave(prev => prev + 1);
            setGameState('ARENA_LOBBY');
            addLog("Wave Cleared! Prepare for the next.", 'success');
        }
        // NORMAL LOGIC
        else if (!enemy.isBoss) {
            let baseName = enemy.name;
            ENEMY_PREFIXES.forEach(p => baseName = baseName.replace(p.name + ' ', ''));
            baseName = baseName.replace('Elite ', '');
            checkQuestCompletion(baseName);
            setGameState('IDLE');
        } else {
            setGameState('IDLE'); // Boss End
        }

        setEnemy(null);
    };

    const handleDeath = () => {
        addLog("💀 Defeated...", 'danger');
        triggerShake();

        if (enemy?.isArena) {
            setArenaWave(1);
            addLog("The Arena crowd boos. Wave progress reset.", 'danger');
        }

        setGameState('IDLE');
        setEnemy(null);
        setLocation(LOCATIONS[0]);
        setPlayer(prev => ({ ...prev, hp: Math.floor(totalMaxHp / 2), mana: 0, gold: Math.floor(prev.gold / 2), zoneProgress: {} }));
        addLog("Woke up in town. Lost half gold. Zone progress reset.", 'system');
    };

    // --- Other Systems (Shop, Tavern, Crafting) ---

    const handleCraft = (recipe) => {
        // Check ingredients
        const hasIngredients = recipe.ingredients.every(ing => {
            const item = player.inventory.find(i => i.name === ing.name);
            return item && item.count >= ing.count;
        });

        if (!hasIngredients || player.gold < recipe.cost) {
            addLog("Missing ingredients or gold!", "error");
            return;
        }

        setPlayer(prev => {
            let newInv = [...prev.inventory];
            // Remove ingredients
            recipe.ingredients.forEach(ing => {
                const idx = newInv.findIndex(i => i.name === ing.name);
                if (newInv[idx].count > ing.count) newInv[idx].count -= ing.count;
                else newInv.splice(idx, 1);
            });

            let newState = { ...prev, gold: prev.gold - recipe.cost, inventory: newInv };

            // Add Result
            if (recipe.result === 'potion') newState.potions++;
            else if (recipe.result === 'mana_potion') newState.manaPotions++;
            else if (recipe.result === 'dmg') newState.damage += recipe.bonus;
            else if (recipe.result === 'def') newState.defense += recipe.bonus;

            return newState;
        });
        addLog(`Crafted ${recipe.name}!`, 'success');
    };

    const handleBuyItem = (item) => {
        if (player.gold < item.cost) {
            addLog("Not enough Gold!", 'error');
            return;
        }

        setPlayer(prev => {
            let newState = { ...prev, gold: prev.gold - item.cost };

            if (item.type === 'consumable') {
                if (item.id === 'potion') newState.potions++;
                else newState.manaPotions++;
                addLog(`Bought ${item.name}`, 'success');
            }
            else if (item.type === 'weapon' || item.type === 'armor') {
                const slot = item.type;
                const currentEquip = prev.equipment[slot];

                // If buying the EXACT same base item (and not epic), merge/upgrade it
                if (currentEquip.name === item.name && currentEquip.rarity !== 'epic') {
                    const statBoost = slot === 'weapon' ? 3 : 2;
                    newState.equipment[slot] = {
                        ...currentEquip,
                        level: currentEquip.level + 1,
                        [slot === 'weapon' ? 'damage' : 'defense']: currentEquip[slot === 'weapon' ? 'damage' : 'defense'] + statBoost
                    };
                    addLog(`Merged ${item.name}! It is now Level ${newState.equipment[slot].level}.`, 'success');
                } else {
                    // --- SMART SWAP LOGIC ---
                    // 1. Create object for the item currently equipped
                    const oldItem = {
                        ...currentEquip,
                        type: slot, // Ensure type is 'weapon' or 'armor'
                        count: 1,
                        value: calculateItemValue(currentEquip) // Calculate current value
                    };

                    // 2. Push old item to inventory
                    newState.inventory.push(oldItem);

                    // 3. Equip new item
                    newState.equipment[slot] = {
                        name: item.name,
                        type: slot,
                        level: 1,
                        rarity: 'common',
                        [slot === 'weapon' ? 'damage' : 'defense']: item[slot === 'weapon' ? 'damage' : 'defense']
                    };
                    addLog(`Equipped ${item.name}. ${currentEquip.name} moved to inventory.`, 'success');
                }
            }
            return newState;
        });
    };

    const handleEquipItem = (index) => {
        const itemToEquip = player.inventory[index];

        // Class Requirement Check
        const shopRef = SHOP_ITEMS.find(i => i.name === itemToEquip.name);
        if (shopRef && shopRef.classReq && shopRef.classReq !== 'all' && shopRef.classReq !== player.class) {
            addLog(`Only ${CLASSES[shopRef.classReq].name}s can use this!`, 'warning');
            return;
        }

        const slot = itemToEquip.type; // 'weapon' or 'armor'

        setPlayer(prev => {
            const currentEquip = prev.equipment[slot];
            let newInv = [...prev.inventory];

            // 1. Remove item from inventory
            if (newInv[index].count > 1) {
                newInv[index].count--;
            } else {
                newInv.splice(index, 1);
            }

            // 2. Move currently equipped item to inventory
            const oldItem = {
                ...currentEquip,
                type: slot,
                count: 1,
                value: calculateItemValue(currentEquip)
            };
            newInv.push(oldItem);

            // 3. Set new equipment
            const newEquipment = {
                ...prev.equipment,
                [slot]: itemToEquip
            };

            return { ...prev, inventory: newInv, equipment: newEquipment };
        });

        addLog(`Equipped ${itemToEquip.name}.`, 'success');
    };

    const sellItem = (index) => {
        if (location.id !== 'town') {
            addLog("Merchants are only found in Town.", "warning");
            return;
        }
        const item = player.inventory[index];
        const value = calculateItemValue(item);

        setPlayer(prev => {
            const newInv = [...prev.inventory];
            if (newInv[index].count > 1) newInv[index].count--;
            else newInv.splice(index, 1);
            return { ...prev, gold: prev.gold + value, inventory: newInv };
        });
        addLog(`Sold ${item.name} for ${value} G.`, 'success');
        spawnFloatingText(`+${value} G`, 'gold');
    };

    const sellAllLoot = () => {
        if (location.id !== 'town') return;
        const totalValue = player.inventory.reduce((acc, item) => acc + (calculateItemValue(item) * item.count), 0);
        setPlayer(prev => ({ ...prev, gold: prev.gold + totalValue, inventory: [] }));
        addLog(`Sold all items for ${totalValue} Gold!`, 'success');
        spawnFloatingText(`+${totalValue} G`, 'gold');
    };

    const handleRest = () => {
        if (player.gold >= 50) {
            setPlayer(p => ({ ...p, hp: totalMaxHp, mana: totalMaxMana, gold: p.gold - 50 }));
            addLog("You slept in a warm bed. HP & Mana restored.", 'success');
            spawnFloatingText("RESTED", "heal");
        } else {
            addLog("Not enough gold (50g) to rest.", 'warning');
        }
    };

    const handleGamble = () => {
        if (player.gold < 10) {
            addLog("You need at least 10g to play dice.", 'warning');
            return;
        }
        const roll = Math.floor(Math.random() * 12) + 1;
        setPlayer(p => ({ ...p, gold: p.gold - 10 }));

        setTimeout(() => {
            if (roll >= 8) {
                const win = 20;
                setPlayer(p => ({ ...p, gold: p.gold + win }));
                addLog(`Rolled a ${roll}. You won ${win} gold!`, 'success');
                spawnFloatingText(`+${win} G`, 'gold');
            } else {
                addLog(`Rolled a ${roll}. You lost your bet.`, 'danger');
            }
        }, 500);
    };

    const generateRandomQuests = () => {
        const quests = [];
        for (let i = 0; i < 3; i++) {
            const isKill = Math.random() > 0.4;
            const enemyType = ENEMY_TYPES[Math.floor(Math.random() * (Math.min(ENEMY_TYPES.length, player.level + 2)))];

            if (isKill) {
                const count = Math.floor(Math.random() * 3) + 2;
                quests.push({
                    id: Date.now() + i,
                    type: 'kill',
                    target: enemyType.name,
                    current: 0,
                    required: count,
                    rewardGold: count * 15 + 50,
                    rewardXp: count * 10 + 20
                });
            } else if (enemyType.drop) {
                const count = Math.floor(Math.random() * 2) + 1;
                quests.push({
                    id: Date.now() + i,
                    type: 'collect',
                    target: enemyType.drop.name,
                    current: 0,
                    required: count,
                    rewardGold: count * enemyType.drop.value * 2 + 50,
                    rewardXp: 50
                });
            }
        }
        setAvailableQuests(quests);
    };

    const acceptQuest = (quest) => {
        if (player.activeQuests.length >= 3) {
            addLog("Quest log full (Max 3). Finish one first!", "warning");
            return;
        }
        setPlayer(p => ({ ...p, activeQuests: [...p.activeQuests, quest] }));
        setAvailableQuests(prev => prev.filter(q => q.id !== quest.id));
        addLog(`Accepted Quest: ${quest.type === 'kill' ? 'Hunt' : 'Collect'} ${quest.required} ${quest.target}.`, 'success');
    };

    // --- Render Helpers ---
    const getBarColor = (c, m, type) => {
        const pct = c / m;
        if (type === 'hp') return pct > 0.6 ? 'bg-green-500' : pct > 0.3 ? 'bg-yellow-500' : 'bg-red-500';
        if (type === 'mana') return 'bg-blue-500';
        return 'bg-purple-500';
    };

    const selectClass = (classId) => {
        const cls = CLASSES[classId];
        setPlayer(prev => ({
            ...prev,
            class: classId,
            maxHp: prev.maxHp + cls.hpBonus, hp: prev.maxHp + cls.hpBonus,
            maxMana: prev.maxMana + cls.manaBonus, mana: prev.maxMana + cls.manaBonus,
            damage: prev.damage + cls.dmgBonus,
            defense: prev.defense + cls.defBonus,
            critChance: cls.critChance,
            inventory: []
        }));
        setGameState('IDLE');
        addLog(`You are now a ${cls.name}.`, 'success');
    };

    const explore = () => {
        // 1. TOWN EXPLORATION (Safe, non-combat events)
        if (location.id === 'town') {
            const roll = Math.random();
            
            if (roll < 0.3) {
                // 30% Chance for a specific town event
                const event = TOWN_EVENTS[Math.floor(Math.random() * TOWN_EVENTS.length)];
                
                // Apply Rewards/Penalties
                setPlayer(p => {
                    let ns = { ...p };
                    if (event.reward.type === 'gold') ns.gold += event.reward.val;
                    if (event.reward.type === 'lose_gold') ns.gold = Math.max(0, ns.gold - event.reward.val);
                    if (event.reward.type === 'xp') ns.xp += event.reward.val;
                    if (event.reward.type === 'heal') ns.hp = Math.min(totalMaxHp, ns.hp + event.reward.val);
                    return ns;
                });

                addLog(event.text + " " + event.msg, event.reward.type === 'lose_gold' || event.reward.type === 'damage' ? 'danger' : 'success');
                if (event.reward.type === 'gold') spawnFloatingText(`+${event.reward.val} G`, 'gold');
                
            } else {
                // 70% Chance for generic flavor text
                const townFlavors = [
                    "The blacksmith is hammering loudly today.",
                    "Guards patrol the streets, eyeing you suspiciously.",
                    "Children are playing tag near the tavern.",
                    "The smell of fresh bread wafts from the bakery.",
                    "A cat rubs against your leg then runs away."
                ];
                addLog(townFlavors[Math.floor(Math.random() * townFlavors.length)], "info");
            }
            return;
        }

        // 2. WILDERNESS EXPLORATION (Danger, Combat, Events)
        const roll = Math.random();

        // 50% Chance: COMBAT
        if (roll < 0.5) {
            generateEnemy('normal');
        } 
        // 30% Chance: INTERACTIVE EVENT (The popup choices you already have)
        else if (roll < 0.8) {
            triggerEvent();
        } 
        // 20% Chance: WILDERNESS FLAVOR EVENT (Instant small rewards/traps)
        else {
            const event = WILD_EVENTS[Math.floor(Math.random() * WILD_EVENTS.length)];
            
            setPlayer(p => {
                let ns = { ...p };
                if (event.reward.type === 'gold') ns.gold += event.reward.val;
                if (event.reward.type === 'xp') ns.xp += event.reward.val;
                if (event.reward.type === 'heal') ns.hp = Math.min(totalMaxHp, ns.hp + event.reward.val);
                if (event.reward.type === 'damage') ns.hp = Math.max(0, ns.hp - event.reward.val);
                if (event.reward.type === 'item') ns.potions++;
                return ns;
            });

            addLog(event.text + " " + event.msg, event.reward.type === 'damage' ? 'danger' : 'success');
            
            // Visuals
            if (event.reward.type === 'damage') {
                triggerShake();
                spawnFloatingText(`-${event.reward.val} HP`, 'damage');
            } else if (event.reward.type === 'gold') {
                spawnFloatingText(`+${event.reward.val} G`, 'gold');
            }
        }
    };

    const usePotion = (type) => {
        if (type === 'hp') {
            if (player.potions > 0 && player.hp < totalMaxHp) {
                setPlayer(p => ({ ...p, hp: Math.min(totalMaxHp, p.hp + 50), potions: p.potions - 1 }));
                addLog("Used Health Potion.", 'success');
            }
        } else {
            if (player.manaPotions > 0 && player.mana < totalMaxMana) {
                setPlayer(p => ({ ...p, mana: Math.min(totalMaxMana, p.mana + 40), manaPotions: p.manaPotions - 1 }));
                addLog("Used Mana Potion.", 'success');
            }
        }
    };

    // --- Main Render ---

    if (gameState === 'CLASS_SELECT') {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center p-4 font-mono">
                <div className="max-w-5xl w-full">
                    <h1 className="text-4xl font-bold text-center mb-8 text-yellow-500">Choose Your Destiny</h1>
                    <div className="grid md:grid-cols-3 gap-6">
                        {Object.values(CLASSES).map(cls => (
                            
                            <button
                                key={cls.id}
                                onClick={() => selectClass(cls.id)}
                                className="bg-slate-800 p-6 rounded-xl border-2 border-slate-700 hover:border-yellow-500 transition-all flex flex-col items-center text-center group relative overflow-hidden"
                            >
                                <div className="mb-4 transform group-hover:scale-110 transition-transform">
                                    <img
                                        src={cls.image || defaultImg}   // FIXED
                                        alt={cls.name}
                                        className="w-60 h-60 " // Increased size for visibility
                                    />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">{cls.name}</h2>
                                <p className="text-slate-400 mb-4 text-sm h-10">{cls.desc}</p>
                                <div className="w-full bg-slate-900/60 p-3 rounded text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span>HP Bonus:</span>
                                        <span className={cls.hpBonus >= 0 ? "text-green-400" : "text-red-400"}>
                                            {cls.hpBonus}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Mana Bonus:</span>
                                        <span className="text-blue-400">{cls.manaBonus}</span>
                                    </div>
                                </div>
                            </button>

                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-slate-900 text-slate-200 font-mono flex flex-col md:flex-row overflow-hidden ${shake ? 'animate-shake' : ''}`}>

            {/* CSS for shake animation */}
            <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
        .animate-shake { animation: shake 0.3s; animation-iteration-count: 1; }
      `}</style>

            {/* --- SIDEBAR --- */}
            <div className="w-full md:w-80 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-4 shrink-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-yellow-500 flex items-center gap-2"><Sword className="w-5 h-5" /> Realms of Text</h1>
                </div>

                <div className="bg-slate-700 p-3 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{CLASSES[player.class]?.icon}</span>
                        <div>
                            <div className="font-bold leading-none">{player.class ? CLASSES[player.class].name : 'Hero'}</div>
                            <div className="text-xs text-slate-400">Lvl {player.level}</div>
                        </div>
                    </div>

                    {/* HP Bar */}
                    <div className="w-full p-[2px] rounded-full bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_10px_rgba(234,179,8,0.4)] mb-1">
                        <div className="w-full h-4 bg-slate-900 rounded-full relative overflow-hidden">
                            <div className={`h-full transition-all duration-300 ease-out ${getBarColor(player.hp, totalMaxHp, 'hp')}`}
                                style={{ width: `${Math.min(100, (player.hp / totalMaxHp) * 100)}%` }}>
                                <div className="w-full h-[40%] bg-white/30 rounded-t-full"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">
                                {player.hp} / {totalMaxHp} HP
                            </div>
                        </div>
                    </div>
                    {/* Mana Bar */}
                    <div className="w-full p-[2px] rounded-full bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_10px_rgba(234,179,8,0.4)] mb-1">
                        <div className="w-full h-4 bg-slate-900 rounded-full relative overflow-hidden">
                            <div className={`h-full transition-all duration-300 ease-out ${getBarColor(player.mana, totalMaxMana, 'mana')}`}
                                style={{ width: `${Math.min(100, (player.mana / totalMaxMana) * 100)}%` }}>
                                <div className="w-full h-[40%] bg-white/30 rounded-t-full"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">
                                {player.mana}/{totalMaxMana} MP
                            </div>
                        </div>
                    </div>
                    {/* XP Bar */}
                    <div className="w-full p-[2px] rounded-full bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 shadow-[0_0_10px_rgba(234,179,8,0.4)] mb-1">
                        <div className="w-full h-4 bg-slate-900 rounded-full relative overflow-hidden">
                            <div className={`h-full transition-all duration-300 ease-out ${getBarColor(player.xp, player.xpToNext, 'xp')}`}
                                style={{ width: `${(player.xp / player.xpToNext) * 100}%` }}>
                                <div className="w-full h-[40%] bg-white/30 rounded-t-full"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] z-10">
                                {player.xp}/{player.xpToNext} XP
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] md:text-xs">
                        <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-400" /> {player.gold}</div>
                        <div className="flex items-center gap-1">
                            <Sword className="w-3 h-3 text-blue-400" />
                            {totalDmg}
                            {weaponEnchant && <span className="text-purple-400">*</span>}
                        </div>
                        <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-400" />
                            {totalDef}
                            {armorEnchant && <span className="text-purple-400">*</span>}
                        </div>
                    </div>

                    
                    <div className="mt-2 pt-2 border-t border-slate-600 flex gap-2">
                        <div className={`w-15 h-auto rounded border transition-all duration-500
                            ${player.equipment.weapon.enchant
                                ? getEnchantGlow(player.equipment.weapon.enchant) // 1. Priority: Enchant Glow
                                : player.equipment.weapon.rarity === 'epic'
                                    ? 'border-purple-500 shadow-[0_0_10px_#a855f7]' // 2. Epic Glow
                                    : 'border-slate-500' 
                                }
                                    `}>
                            <img src={getItemImage(player.equipment.weapon.name, player.equipment.weapon.rarity)} className="w-full h-full rounded" />
                        </div>

                        {/* ARMOR SLOT */}
                        <div className={`w-15 h-auto rounded border transition-all duration-500
                                ${player.equipment.armor.enchant
                                ? getEnchantGlow(player.equipment.armor.enchant)
                                : player.equipment.armor.rarity === 'epic'
                                    ? 'border-purple-500 shadow-[0_0_10px_#a855f7]'
                                    : 'border-slate-500'
                            }
                            `}>
                            <img src={getItemImage(player.equipment.armor.name, player.equipment.armor.rarity)} className="w-full h-full rounded" />
                        </div>

                        <div className="text-[10px] flex flex-col justify-center text-slate-400">
                            <div className={player.equipment.weapon.enchant ? 'text-yellow-200' : ''}>
                                {player.equipment.weapon.name}
                            </div>
                            <div className={player.equipment.armor.enchant ? 'text-yellow-200' : ''}>
                                {player.equipment.armor.name}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Active Quests Mini View */}
                <div className="bg-slate-700 p-3 rounded-lg text-xs">
                    <div className="font-bold text-slate-400 mb-2 flex justify-between">
                        <span>ACTIVE BOUNTIES</span>
                        <span>{player.activeQuests.length}/3</span>
                    </div>
                    {player.activeQuests.length === 0 ? <div className="text-slate-500 italic">No active quests.</div> : (
                        <div className="space-y-1">
                            {player.activeQuests.map(q => (
                                <div key={q.id} className="flex justify-between items-center bg-slate-800 p-1 rounded">
                                    <span>{q.type === 'kill' ? '⚔️' : '📦'} {q.target}</span>
                                    <span className={q.current >= q.required || (q.type === 'collect' && player.inventory.find(i => i.name === q.target)?.count >= q.required) ? 'text-green-400' : 'text-yellow-500'}>
                                        {q.type === 'collect' ? (player.inventory.find(i => i.name === q.target)?.count || 0) : q.current}/{q.required}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {location.id === 'town' && <button onClick={() => checkQuestCompletion()} className="w-full mt-2 bg-blue-600 hover:bg-blue-500 py-1 rounded text-center">Claim Rewards</button>}
                </div>

                <button onClick={() => setGameState('INVENTORY')} className="bg-slate-700 hover:bg-slate-600 p-3 rounded-lg flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2"><Backpack className="w-4 h-4" /> Inventory</div>
                    <span className="bg-slate-900 px-2 rounded">{player.inventory.reduce((acc, i) => acc + i.count, 0)}</span>
                </button>
                
                {/* <div className="flex gap-2 w-full">
                    <button onClick={saveToSupabase} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 rounded-md transition-colors" >
                        <Save className="w-4 h-4" /> Save to Cloud
                    </button>
                    <button onClick={handleLogout} className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-1.5 rounded-md transition-colors" >
                        Logout
                    </button>
                </div> */}
                <div className="bg-slate-700 p-3 rounded-lg shadow-md mt-auto">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold mb-1 text-sm"><Map className="w-4 h-4" /> {location.name}</div>
                </div>
            </div>

            {/* --- MAIN AREA --- */}
            <div className="flex-1 flex flex-col h-[100vh] relative">

                {/* Scene Visuals */}
                <div className="h-55 bg-slate-950 border-b border-slate-700 p-4 flex items-center justify-center relative overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-10 pointer-events-none flex justify-center items-center text-9xl select-none">
                        {location.id === 'town' ? '🏠' : location.id === 'forest' ? '🌲' : location.id === 'cave' ? '🏔️' : '🏰'}
                    </div>

                    {/* Floating Combat Text Layer */}
                    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
                        {floatingTexts.map(ft => (
                            <div key={ft.id}
                                className={`absolute text-xl font-bold animate-bounce ${ft.color}`}
                                style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                            >
                                {ft.text}
                            </div>
                        ))}
                    </div>

                    <div className="z-10 text-center w-full max-w-xl">
                        {gameState === 'COMBAT' && enemy && (
                            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                                {(() => {
                                    // 1. Find which enemy type this is (e.g., "Rabid Wolf" matches "Wolf")
                                    const baseKey = Object.keys(ENEMY_IMAGES).find(key => enemy.name.includes(key));
                                    const imageUrl = baseKey ? ENEMY_IMAGES[baseKey] : null;
                                    const hasCustomImage = imageUrl && imageUrl !== 'INSERT_YOUR_URL_HERE';

                                    return hasCustomImage ? (
                                        // SHOW IMAGE
                                        <div className={`relative mb-2 ${enemy.isElite ? 'drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]' : ''}`}>
                                            <img
                                                src={imageUrl}
                                                alt={enemy.name}
                                                className={`w-32 h-32 object-contain ${enemy.isElite ? 'scale-110' : ''}`}
                                            />
                                            {/* Add a red glow/pulse for Elites/Bosses */}
                                            {enemy.isElite && <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full -z-10 animate-pulse"></div>}
                                        </div>
                                    ) : (
                                        // SHOW EMOJI (Fallback)
                                        <div className={`text-5xl mb-2 ${enemy.isElite ? 'animate-pulse' : ''}`}>
                                            {enemy.isBoss ? '👹' : '👾'}
                                        </div>
                                    );
                                })()}

                                {/* --- ENEMY STATS --- */}
                                <div className={`text-lg font-bold ${enemy.isElite ? 'text-red-500' : 'text-red-300'}`}>
                                    {enemy.name} <span className="text-xs bg-slate-800 px-1 rounded text-slate-400">Lvl {enemy.level}</span>
                                </div>

                                {/* HP BAR */}
                                <div className="w-full bg-slate-800 h-3 mt-1 rounded-full overflow-hidden border border-slate-700 relative max-w-[200px]">
                                    <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md">
                                        {enemy.hp} / {enemy.maxHp} HP
                                    </div>
                                </div>

                            </div>
                        )}

                        {gameState === 'INTERACTIVE_EVENT' && activeEvent && (
                            <div className="flex flex-col items-center animate-in zoom-in duration-300">
                                <img src={getItemImage(activeEvent.image)} alt={activeEvent.title} className="w-20 h-20 rounded-xl border-2 border-yellow-500 mb-2 shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
                                <h2 className="text-2xl font-bold text-yellow-400">{activeEvent.title}</h2>
                                <p className="text-slate-300 text-sm mt-1 max-w-md">{activeEvent.desc}</p>
                            </div>
                        )}
                        {/* TOWN BUILDINGS VISUALS */}
                        {gameState === 'TAVERN' && (
                            <div className="flex flex-col items-center">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/3llbtwwc9ihak8hh6xc1wqp9ef0s" alt="taveran" className='w-16 h-16' />
                                <h2 className="text-xl font-bold text-amber-200">The Rusty Tankard</h2>
                            </div>
                        )}
                        {gameState === 'ALCHEMIST' && (
                            <div className="flex flex-col items-center">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/d9aa4abhlup1ehdzbic4b3xanr2g" alt="" className='w-16 h-16' />
                                <h2 className="text-xl font-bold text-green-200">Bubbling Brews</h2>
                            </div>
                        )}
                        {gameState === 'ARENA_LOBBY' && (
                            <div className="flex flex-col items-center">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/gafv8hvlo9w6tqot95smu2pdbwef" alt="" className='w-16 h-16' />
                                <h2 className="text-xl font-bold text-red-200">The Arena (Wave {arenaWave})</h2>
                            </div>
                        )}
                        {gameState === 'QUEST_BOARD' && (
                            <div className="flex flex-col items-center">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/9i4pgcumgp1mtx3idkne3zop8867" alt="Notice Board" className='w-16 h-16' />
                                <h2 className="text-xl font-bold text-yellow-500">Town Notice Board</h2>
                            </div>
                        )}
                        {gameState === 'IDLE' && <div className="text-slate-500 italic">Adventure awaits...</div>}
                        {gameState === 'INVENTORY' && <div className="text-xl font-bold text-amber-100 flex flex-col items-center"><Backpack className="w-10 h-10 mb-2" /> Backpack</div>}
                        {gameState === 'SHOP' && <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/rijfy4ijj5ypknyrcqj9wu69gij8" alt="market" className='w-16 h-16' />}
                        {gameState === 'BLACKSMITH' && (
                            <div className="flex flex-col items-center">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/luyt80v4tob11xjct02jlewi0m8s" alt="forge" className='w-16 h-16' />
                                <h2 className="text-xl font-bold text-slate-300">The Forge & Enchanter</h2>
                            </div>
                        )}
                    </div>
                </div>

                {/* Logs */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-900 custom-scrollbar">
                    {logs.map((log) => (
                        <div key={log.id} className={`p-2 rounded text-xs md:text-sm border-l-2 animate-fade-in ${log.type === 'danger' ? 'bg-red-950/30 border-red-500 text-red-200' :
                                log.type === 'success' ? 'bg-green-950/30 border-green-500 text-green-200' :
                                    log.type === 'warning' ? 'bg-yellow-950/30 border-yellow-500 text-yellow-200' :
                                        log.type === 'system' ? 'bg-slate-800/50 border-slate-500 text-slate-400' :
                                            'bg-blue-950/20 border-blue-500 text-blue-200'
                            }`}>
                            {log.text}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>

                {/* Controls Area */}
                <div className="bg-slate-800 p-5 border-t border-slate-700 min-h-[150px] flex flex-col justify-center shrink-0 z-10">
                    {gameState === 'COMBAT' && (
                        <div className="w-full max-w-4xl mx-auto">
                            {/* Skill Bar */}
                            <div className="grid grid-cols-5 gap-2 mb-2">
                                {/* Potions Slots */}
                                <button onClick={() => usePotion('hp')} className="bg-slate-700 hover:bg-slate-600 p-2 rounded border border-green-900 flex flex-col items-center relative">
                                    <Heart className="w-5 h-5 text-red-500" />
                                    <span className="text-[10px] font-bold absolute bottom-0 right-1">{player.potions}</span>
                                </button>
                                <button onClick={() => usePotion('mana')} className="bg-slate-700 hover:bg-slate-600 p-2 rounded border border-blue-900 flex flex-col items-center relative">
                                    <Flame className="w-5 h-5 text-blue-500" />
                                    <span className="text-[10px] font-bold absolute bottom-0 right-1">{player.manaPotions}</span>
                                </button>

                                {/* Class Skills */}
                                {CLASSES[player.class].skills.map(skill => {
                                    const isLocked = player.level < skill.level;
                                    const onCooldown = (player.cooldowns[skill.id] || 0) > 0;
                                    const noMana = player.mana < skill.cost;

                                    return (
                                        <button
                                            key={skill.id}
                                            disabled={isLocked || onCooldown || noMana}
                                            onClick={() => performAttack(skill)}
                                            className={`
                                    p-2 rounded border relative flex flex-col items-center justify-center transition-all
                                    ${isLocked ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed' :
                                                    onCooldown ? 'bg-slate-800 border-red-900 cursor-wait' :
                                                        noMana ? 'bg-slate-800 border-blue-900 opacity-80 cursor-not-allowed' :
                                                            'bg-slate-700 hover:bg-slate-600 border-slate-500 hover:border-yellow-500 active:scale-95'}
                                `}
                                            title={isLocked ? `Unlocks at Lvl ${skill.level}` : skill.desc}
                                        >
                                            {isLocked ? <span className="text-xs text-slate-500">Lvl {skill.level}</span> : (
                                                <>
                                                    <div className="font-bold text-xs text-center leading-tight mb-1">{skill.name}</div>
                                                    <div className="text-[10px] text-blue-300">{skill.cost} MP</div>
                                                    {onCooldown && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded font-bold text-red-400 text-lg">
                                                            {player.cooldowns[skill.id]}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {gameState === 'INTERACTIVE_EVENT' && activeEvent && (
                        <div className="flex flex-col items-center justify-center gap-3 w-full max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                                {activeEvent.choices.map((choice, idx) => (
                                    <button key={idx} onClick={() => resolveEvent(choice)} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 p-3 rounded flex flex-col items-center justify-center gap-1 group">
                                        <div className="font-bold group-hover:text-yellow-400">{choice.text}</div>
                                        {choice.chance < 1.0 && <div className="text-[10px] text-red-400">Risk: {(100 - choice.chance * 100).toFixed(0)}% Fail</div>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {gameState === 'TAVERN' && (
                        <div className="flex gap-4 justify-center items-center h-full w-full">
                            <button onClick={handleRest} className="bg-green-800 hover:bg-green-700 p-4 rounded border border-green-600 flex flex-col items-center min-w-[120px]">
                                <div className="text-lg font-bold mb-1">Rest</div>
                                <div className="text-xs text-green-300 mb-2">Restore All</div>
                                <div className="text-yellow-400 font-bold">50 G</div>
                            </button>
                            <button onClick={handleGamble} className="bg-amber-800 hover:bg-amber-700 p-4 rounded border border-amber-600 flex flex-col items-center min-w-[120px]">
                                <div className="text-lg font-bold mb-1">Gamble</div>
                                <div className="text-xs text-amber-300 mb-2">Roll Dice (7+)</div>
                                <div className="text-yellow-400 font-bold">10 G</div>
                            </button>
                            <button onClick={() => setGameState('IDLE')} className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded h-fit">Leave</button>
                        </div>
                    )}

                    {/* ARENA LOBBY */}
                    {gameState === 'ARENA_LOBBY' && (
                        <div className="flex flex-col gap-4 justify-center items-center h-full w-full">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-500">WAVE {arenaWave}</div>
                                <div className="text-slate-400">Difficulty Multiplier: x{(1 + (arenaWave * 0.2)).toFixed(1)}</div>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => generateEnemy('arena')} className="bg-red-700 hover:bg-red-600 p-4 rounded-lg border-2 border-red-500 flex flex-col items-center min-w-[160px] animate-pulse">
                                    <Swords className="w-8 h-8 mb-2" />
                                    <div className="text-xl font-bold">FIGHT!</div>
                                </button>
                                <button onClick={() => { setArenaWave(1); setGameState('IDLE'); }} className="bg-slate-600 hover:bg-slate-500 px-6 py-4 rounded-lg border border-slate-500">
                                    Retreat (Reset)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ALCHEMIST UI */}
                    {gameState === 'ALCHEMIST' && (
                        <div className="flex flex-col h-full w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto max-h-[120px] mb-2">
                                {CRAFTING_RECIPES.map((recipe, idx) => (
                                    <button key={idx} onClick={() => handleCraft(recipe)} className="bg-slate-700 hover:bg-slate-600 p-2 rounded flex justify-between items-center border border-slate-600 group">
                                        <div className="flex flex-col items-start">
                                            <div className="font-bold text-green-300">{recipe.name}</div>
                                            <div className="text-[10px] text-slate-400">
                                                {recipe.ingredients.map(ing => `${ing.count}x ${ing.name}`).join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-yellow-400 font-bold text-sm">{recipe.cost} G</div>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setGameState('IDLE')} className="mt-auto bg-slate-600 hover:bg-slate-500 w-full py-2 rounded">Leave</button>
                        </div>
                    )}

                    {gameState === 'QUEST_BOARD' && (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex gap-2 mb-2 justify-center">
                                <button onClick={generateRandomQuests} className="text-xs bg-slate-700 px-3 py-1 rounded hover:bg-slate-600">Refresh Notices</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 overflow-y-auto max-h-[120px]">
                                {availableQuests.length === 0 ? <div className="text-slate-500 text-center col-span-3">No more notices. Check back later.</div> :
                                    availableQuests.map(q => (
                                        <button key={q.id} onClick={() => acceptQuest(q)} className="bg-amber-900/30 border border-amber-700/50 p-2 rounded text-left hover:bg-amber-900/50 transition-colors group">
                                            <div className="font-bold text-amber-500 text-sm group-hover:text-amber-400">{q.type === 'kill' ? 'Wanted' : 'Request'}: {q.target}</div>
                                            <div className="text-xs text-slate-400 mb-1">{q.type === 'kill' ? `Hunt ${q.required} targets` : `Gather ${q.required} items`}</div>
                                            <div className="text-xs text-yellow-200 font-bold">{q.rewardGold} G • {q.rewardXp} XP</div>
                                        </button>
                                    ))}
                            </div>
                            <button onClick={() => setGameState('IDLE')} className="mt-2 bg-slate-600 w-full py-1 rounded text-sm">Leave Board</button>
                        </div>
                    )}

                    {gameState === 'INVENTORY' && (
                        <div className="w-full h-full flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-slate-300">Backpack</h3>
                                {location.id === 'town' && player.inventory.length > 0 && (
                                    <button onClick={sellAllLoot} className="text-[10px] bg-yellow-700 px-2 py-1 rounded hover:bg-yellow-600">Sell All ({player.inventory.reduce((a, b) => a + (calculateItemValue(b) * b.count), 0)}G)</button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                                {player.inventory.map((item, idx) => {
                                    const visual = getItemImage(item.name, item.rarity);
                                    const isEquippable = item.type === 'weapon' || item.type === 'armor';
                                    const itemValue = calculateItemValue(item);

                                    let glowClass = 'border-slate-600';
                                    if (item.enchant) {
                                        glowClass = getEnchantGlow(item.enchant);
                                    } else if (item.rarity === 'epic') {
                                        glowClass = 'border-purple-500 shadow-sm shadow-purple-900';
                                    }
                                    return (
                                        <div key={idx} className={`bg-slate-700 p-2 rounded text-xs flex gap-2 relative group border transition-all ${glowClass}`}>

                                            <div className="shrink-0">
                                                <img src={visual} alt={item.name} className="w-10 h-10 rounded border border-slate-500" />
                                            </div>
                                            <div className="flex flex-col w-full overflow-hidden justify-between">
                                                <div className="flex justify-between items-start">
                                                    <span className={`font-bold truncate ${item.rarity === 'epic' ? 'text-purple-300' : 'text-slate-200'}`}>{item.name}</span>
                                                    {item.level && <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">Lvl {item.level}</span>}
                                                </div>
                                                <div className="flex gap-2 text-[10px] text-slate-400 items-center">
                                                    {item.damage > 0 && <span className="flex items-center gap-1 text-blue-300"><Sword className="w-3 h-3" /> {item.damage}</span>}
                                                    {item.defense > 0 && <span className="flex items-center gap-1 text-green-300"><Shield className="w-3 h-3" /> {item.defense}</span>}
                                                    {item.count > 1 && <span>x{item.count}</span>}
                                                </div>
                                                {item.enchant && <div className="text-[9px] text-purple-300 mt-1">✨ {item.enchant.name}</div>}
                                            </div>
                                            <div className="flex flex-col gap-1 shrink-0 min-w-[50px]">
                                                <div className="text-right text-yellow-500 font-bold text-[10px]">{itemValue} G</div>

                                                {isEquippable && (
                                                    <button onClick={() => handleEquipItem(idx)} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] py-1 rounded text-center shadow">
                                                        Equip
                                                    </button>
                                                )}
                                                {location.id === 'town' && (
                                                    <button onClick={() => sellItem(idx)} className="bg-red-900/50 hover:bg-red-700 text-red-200 text-[10px] py-1 rounded text-center">
                                                        Sell
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {player.inventory.length === 0 && <div className="col-span-2 text-center text-slate-500 italic py-4">Bag is empty</div>}
                            </div>
                            <button onClick={() => setGameState('IDLE')} className="mt-auto bg-slate-600 w-full py-2 rounded text-xs">Close</button>
                        </div>
                    )}

                    {gameState === 'SHOP' && (
                        <div className="flex flex-col h-full">
                            <div className=" float-animation flex gap-2 mb-2 overflow-x-auto pb-2">
                                {SHOP_ITEMS.map(item => {
                                    if (item.classReq && item.classReq !== 'all' && item.classReq !== player.class) return null;
                                    const visual = getItemImage(item.name);
                                    return (
                                       
                                        <button
                                            key={item.id}
                                            onClick={() => handleBuyItem(item)}
                                            className=" relative flex flex-col items-center justify-center min-w-[100px] p-4 group"
                                        >
                                            {/* 1. The Background/Base */}
                                            <div className="absolute inset-0 bg-slate-900 rounded-lg border border-slate-600 opacity-80 group-hover:bg-slate-800"></div>
                                            <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none">
                                                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-300"></div>
                                                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-300"></div>
                                                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-300"></div>
                                                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-300"></div>
                                            </div>

                                            {/* 3. Actual Content (Z-index ensures it sits right) */}
                                            <div className="relative z-10 flex flex-col items-center gap-1">
                                                <img src={visual} alt={item.name} className="w-10 h-10 rounded border border-slate-500 shadow-inner" />
                                                <span className="font-bold text-xs text-yellow-400 tracking-wide">{item.name}</span>
                                                <span className="text-xs text-slate-400">{item.cost} G</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button onClick={() => setGameState('IDLE')} className="w-full bg-slate-600 py-2 rounded mt-auto">Leave Shop</button>
                        </div>
                    )}

                    {gameState === 'BLACKSMITH' && (
                        <div className="flex flex-col items-center h-full w-full p-2 overflow-y-auto">

                            <h2 className="text-lg font-bold text-slate-300 mb-4 flex gap-2">
                                <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/uj9bs094jggo7sprmkkahlcdeunx"
                                    alt=""
                                    className='w-5 h-auto -rotate-45' /> The Forge
                            </h2>

                            {/* --- TAB TOGGLES --- */}
                            <div className="flex gap-2 mb-6 bg-slate-800 p-1 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setForgeMode('UPGRADE')}
                                    className={`px-4 py-1 text-sm rounded transition-all ${forgeMode === 'UPGRADE'
                                        ? 'bg-slate-600 text-white font-bold shadow'
                                        : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    Refine
                                </button>
                                <button
                                    onClick={() => setForgeMode('ENCHANT')}
                                    className={`px-4 py-1 text-sm rounded transition-all flex gap-1 items-center ${forgeMode === 'ENCHANT'
                                        ? 'bg-purple-900/50 text-purple-200 font-bold shadow border border-purple-500/30'
                                        : 'text-slate-400 hover:text-purple-300'
                                        }`}
                                >
                                    <Sparkles className="w-3 h-3" /> Enchant
                                </button>
                            </div>

                            {/* --- UPGRADE SECTION (Only shows if forgeMode is UPGRADE) --- */}
                            {forgeMode === 'UPGRADE' && (
                                <div className="flex gap-4 justify-center items-center mb-6 animate-in fade-in duration-300">{/* Weapon Upgrade Button */}
                                    <button onClick={() => {
                                        const cost = player.equipment.weapon.level * 100;
                                        if (player.gold >= cost) {
                                            setPlayer(p => ({ ...p, gold: p.gold - cost, equipment: { ...p.equipment, weapon: { ...p.equipment.weapon, level: p.equipment.weapon.level + 1, damage: p.equipment.weapon.damage + 3 } } }));
                                            addLog(`Upgraded Weapon to +${player.equipment.weapon.level + 1}!`, 'success');
                                        } else addLog(`Need ${cost} Gold`, 'error');
                                    }} className="bg-slate-700 hover:bg-slate-600 p-4 rounded border border-slate-600 flex flex-col items-center min-w-[140px] transition-colors">
                                        <div className=" float-animation relative w-16 h-16 flex items-center justify-center mb-2 shrink-0">
                                            <div className="absolute inset-0 z-20 pointer-events-none rounded-md overflow-hidden shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                <div className="absolute inset-0 border-2 border-yellow-700/80 rounded-md"></div>
                                                <div className="absolute inset-[2px] border border-yellow-500/50 rounded-sm"></div>
                                                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-300 bg-yellow-900/20"></div>
                                            </div>
                                            <div className="absolute inset-1 bg-slate-900/80 z-0 rounded-sm border border-slate-700 shadow-inner"></div>
                                            <img
                                                src={getItemImage(player.equipment.weapon.name, player.equipment.weapon.rarity)}
                                                alt="Weapon"
                                                className="relative w-10 h-10 rounded-sm z-10"
                                            />
                                        </div>
                                        <div className="text-sm font-bold mb-1">Upgrade Weapon</div>
                                        <div className="text-xs text-slate-400 mb-2">+3 Dmg</div>
                                        <div className="text-yellow-400 font-bold">{player.equipment.weapon.level * 100} G</div>
                                    </button>

                                    <button onClick={() => {
                                        const cost = player.equipment.armor.level * 100;
                                        if (player.gold >= cost) {
                                            setPlayer(p => ({ ...p, gold: p.gold - cost, equipment: { ...p.equipment, armor: { ...p.equipment.armor, level: p.equipment.armor.level + 1, defense: p.equipment.armor.defense + 2 } } }));
                                            addLog(`Upgraded Armor to +${player.equipment.armor.level + 1}!`, 'success');
                                        } else addLog(`Need ${cost} Gold`, 'error');
                                    }} className="bg-slate-700 hover:bg-slate-600 p-4 rounded border border-slate-600 flex flex-col items-center min-w-[140px] transition-colors">
                                        <div className="float-animation relative w-16 h-16 flex items-center justify-center mb-2 shrink-0">
                                            <div className="absolute inset-0 z-20 pointer-events-none rounded-md overflow-hidden shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                                                <div className="absolute inset-0 border-2 border-yellow-700/80 rounded-md"></div>
                                                <div className="absolute inset-[2px] border border-yellow-500/50 rounded-sm"></div>
                                                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-300 bg-yellow-900/20"></div>
                                                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-300 bg-yellow-900/20"></div>
                                            </div>
                                            <div className="absolute inset-1 bg-slate-900/80 z-0 rounded-sm border border-slate-700 shadow-inner"></div>
                                            <img
                                                src={getItemImage(player.equipment.armor.name, player.equipment.armor.rarity)}
                                                alt="Weapon"
                                                className="relative w-10 h-10 rounded-sm z-10"
                                            />
                                        </div>
                                        <div className="text-sm font-bold mb-1">Upgrade Armor</div>
                                        <div className="text-xs text-slate-400 mb-2">+2 Def</div>
                                        <div className="text-yellow-400 font-bold">{player.equipment.armor.level * 100} G</div>
                                    </button>
                                </div>
                            )}

                            {/* --- ENCHANT SECTION (Only shows if forgeMode is ENCHANT) --- */}
                            {forgeMode === 'ENCHANT' && (
                                <div className="bg-slate-800 p-4 rounded-xl border border-purple-500/50 w-full max-w-md mb-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="text-center text-purple-300 font-bold mb-2 flex items-center justify-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Enchant Gear (200 G)
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => handleEnchant('weapon')} className="bg-slate-700 hover:bg-slate-600 p-3 rounded border border-purple-900 group relative overflow-hidden">
                                            <div className="text-xs text-slate-400">Current Weapon Effect</div>
                                            <div className="font-bold text-purple-200 h-6 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {weaponEnchant ? weaponEnchant.name : 'None'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 h-4 overflow-hidden">{weaponEnchant?.desc || 'No magic'}</div>
                                            <div className="mt-2 text-yellow-500 font-bold text-xs group-hover:scale-110 transition-transform">Enchant</div>
                                        </button>

                                        <button onClick={() => handleEnchant('armor')} className="bg-slate-700 hover:bg-slate-600 p-3 rounded border border-purple-900 group relative overflow-hidden">
                                            <div className="text-xs text-slate-400">Current Armor Effect</div>
                                            <div className="font-bold text-purple-200 h-6 overflow-hidden text-ellipsis whitespace-nowrap">
                                                {armorEnchant ? armorEnchant.name : 'None'}
                                            </div>
                                            <div className="text-[10px] text-slate-500 h-4 overflow-hidden">{armorEnchant?.desc || 'No magic'}</div>
                                            <div className="mt-2 text-yellow-500 font-bold text-xs group-hover:scale-110 transition-transform">Enchant</div>
                                        </button>
                                    </div>
                                    <div className="mt-4 text-center text-[10px] text-purple-400/60 italic">
                                        Warning: Enchanting replaces existing effects.
                                    </div>
                                </div>
                            )}

                            <button onClick={() => setGameState('IDLE')} className="bg-slate-600 hover:bg-slate-500 px-6 py-2 rounded h-fit text-sm mt-auto">Leave</button>
                        </div>
                    )}

                    {gameState === 'IDLE' && (
                        <div className="flex flex-col gap-2">
                            {location.id === 'town' ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <button onClick={() => setGameState('SHOP')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/rijfy4ijj5ypknyrcqj9wu69gij8" alt="market" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Market</span>
                                    </button>
                                    <button onClick={() => { setGameState('QUEST_BOARD'); if (availableQuests.length === 0) generateRandomQuests(); }} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/9i4pgcumgp1mtx3idkne3zop8867" alt="Notice Board" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Notice Board</span>
                                    </button>
                                    <button onClick={() => setGameState('BLACKSMITH')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/luyt80v4tob11xjct02jlewi0m8s" alt="forge" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Blacksmith</span>
                                    </button>
                                    <button onClick={() => setGameState('TAVERN')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/3llbtwwc9ihak8hh6xc1wqp9ef0s" alt="taveran" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Tavern</span>
                                    </button>
                                    <button onClick={() => setGameState('ALCHEMIST')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/d9aa4abhlup1ehdzbic4b3xanr2g" alt="" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Alchemist</span>
                                    </button>
                                    <button onClick={() => setGameState('ARENA_LOBBY')} className="bg-slate-800 hover:bg-slate-700 p-3 rounded border border-slate-700 flex flex-col items-center group">
                                        <img src="https://imgproxy.attic.sh/insecure/f:png/plain/https://attic.sh/gafv8hvlo9w6tqot95smu2pdbwef" alt="" className='w-10 h-10' />
                                        <span className="text-xs font-bold">Arena</span>
                                    </button>
                                    
                                    
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between text-xs text-slate-400 px-1">
                                        <span>Danger Level</span>
                                        <span>{player.zoneProgress[location.id] || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                                        <div className="bg-red-600 h-full transition-all duration-500" style={{ width: `${player.zoneProgress[location.id] || 0}%` }}></div>
                                    </div>
                                    {(player.zoneProgress[location.id] || 0) >= 100 ? (
                                        <button onClick={() => generateEnemy('boss')} className="w-full bg-purple-700 hover:bg-purple-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg flex justify-center items-center gap-2 animate-pulse">
                                            <Crown className="w-5 h-5" /> CHALLENGE BOSS
                                        </button>
                                    ) : (
                                        <button onClick={explore} className="w-full bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg flex justify-center items-center gap-2 active:scale-95 transition-transform">
                                            <Map className="w-5 h-5" /> EXPLORE AREA
                                        </button>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mt-2">
                                {LOCATIONS.map(loc => (
                                    <button key={loc.id} onClick={() => { setLocation(loc); setGameState('IDLE'); addLog(`Arrived at ${loc.name}.`, 'system'); }} disabled={location.id === loc.id}
                                        className={`px-4 py-2 rounded text-xs border whitespace-nowrap ${location.id === loc.id ? 'bg-slate-700 border-slate-500 text-slate-400' : 'bg-slate-800 border-slate-600 hover:bg-slate-700'}`}>
                                        {loc.id === 'town' ? '🏠 ' : ''}{loc.name}
                                    </button>
                                ))}
                                <div className="flex gap-2 w-full">
                                    <button onClick={saveToSupabase} className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 rounded-md transition-colors" >
                                        <Save className="w-4 h-4" /> Save to Cloud
                                    </button>
                                    <button onClick={handleLogout} className="w-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium py-1.5 rounded-md transition-colors" >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}