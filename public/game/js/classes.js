/**
 * Abyss Monarch - Classes and Promotions System (Prestige & Talents Update)
 * Defines all classes, stat progression multipliers, and promotion trees.
 */

class ClassSystem {
    constructor() {
        this.classes = {
            // Level 1-10: Starting Class
            'Novice': {
                id: 'Novice',
                name: 'Bezklasowy (Novice)',
                tier: 0,
                desc: 'Początkowa ścieżka każdego Przebudzonego. Brak specjalizacji, ale pełna elastyczność.',
                statsMultiplier: { hp: 10, mp: 5, patk: 1.0, matk: 1.0, def: 1.0 },
                promotions: ['Warrior', 'Mage', 'Assassin', 'Ranger', 'Cleric']
            },

            // Level 10+: Tier 1 Base Classes
            'Warrior': {
                id: 'Warrior',
                name: 'Wojownik',
                tier: 1,
                desc: 'Specjalista od walki w zwarciu i obrony. Potężne HP i pancerz.',
                statsMultiplier: { hp: 15, mp: 6, patk: 2.0, matk: 0.5, def: 1.5 },
                promotions: ['Berserker', 'Knight'],
                requirements: { level: 10, stats: { str: 12 } }
            },
            'Mage': {
                id: 'Mage',
                name: 'Mag',
                tier: 1,
                desc: 'Włada potężną energią magiczną. Niskie HP, ale gigantyczne obrażenia zaklęć.',
                statsMultiplier: { hp: 8, mp: 12, patk: 0.5, matk: 2.5, def: 0.8 },
                promotions: ['Sorcerer', 'Summoner'],
                requirements: { level: 10, stats: { int: 12 } }
            },
            'Assassin': {
                id: 'Assassin',
                name: 'Zabójca',
                tier: 1,
                desc: 'Mistrz uników i ciosów krytycznych. Działa z ukrycia.',
                statsMultiplier: { hp: 10, mp: 8, patk: 1.8, matk: 0.8, def: 1.0 },
                promotions: ['ShadowBlade', 'Viper'],
                requirements: { level: 10, stats: { dex: 12 } }
            },
            'Ranger': {
                id: 'Ranger',
                name: 'Łucznik',
                tier: 1,
                desc: 'Zasypuje wrogów gradem strzał z dystansu. Wysoka zręczność.',
                statsMultiplier: { hp: 11, mp: 7, patk: 1.7, matk: 0.9, def: 1.1 },
                promotions: ['Sniper', 'Beastmaster'],
                requirements: { level: 10, stats: { dex: 11, str: 11 } }
            },
            'Cleric': {
                id: 'Cleric',
                name: 'Kleryk',
                tier: 1,
                desc: 'Wspiera drużynę potężnymi czarami leczenia i tarczami ochronnymi.',
                statsMultiplier: { hp: 12, mp: 10, patk: 1.0, matk: 1.5, def: 1.2 },
                promotions: ['Priest', 'Monk'],
                requirements: { level: 10, stats: { wis: 12 } }
            },

            // Level 30+: Tier 2 Specializations
            'Berserker': {
                id: 'Berserker',
                name: 'Berserker',
                tier: 2,
                desc: 'Wojownik szukający szału bojowego. Im mniej ma HP, tym mocniej uderza.',
                statsMultiplier: { hp: 18, mp: 5, patk: 2.8, matk: 0.2, def: 1.2 },
                promotions: ['DoomMonarch'],
                requirements: { level: 30, stats: { str: 35, vit: 20 } }
            },
            'Knight': {
                id: 'Knight',
                name: 'Rycerz',
                tier: 2,
                desc: 'Żywa tarcza drużyny. Zdolny przyjąć na siebie każdy cios.',
                statsMultiplier: { hp: 22, mp: 8, patk: 1.5, matk: 0.8, def: 2.5 },
                promotions: ['Paladin'],
                requirements: { level: 30, stats: { vit: 35, str: 20 } }
            },
            'Sorcerer': {
                id: 'Sorcerer',
                name: 'Czarodziej',
                tier: 2,
                desc: 'Kontroluje żywioły ognia i lodu. Niszczy całe hordy wroga naraz.',
                statsMultiplier: { hp: 9, mp: 18, patk: 0.3, matk: 3.8, def: 0.7 },
                promotions: ['Archmage'],
                requirements: { level: 30, stats: { int: 35, wis: 25 } }
            },
            'Summoner': {
                id: 'Summoner',
                name: 'Przywoływacz',
                tier: 2,
                desc: 'Przyzywa bestie z innych wymiarów do walki po swojej stronie.',
                statsMultiplier: { hp: 11, mp: 15, patk: 0.8, matk: 2.8, def: 1.1 },
                promotions: ['VoidMonarch'],
                requirements: { level: 30, stats: { int: 30, wis: 30 } }
            },
            'ShadowBlade': {
                id: 'ShadowBlade',
                name: 'Ostrze Cienia',
                tier: 2,
                desc: 'Zabójca potrafiący wtapiać się w cienie i zadawać śmiertelne ciosy krytyczne.',
                statsMultiplier: { hp: 10, mp: 10, patk: 2.5, matk: 1.2, def: 0.9 },
                promotions: ['MonarchOfShadows'],
                requirements: { level: 30, stats: { dex: 35, luk: 25 } }
            },
            'Viper': {
                id: 'Viper',
                name: 'Żmija (Viper)',
                tier: 2,
                desc: 'Zatruwa przeciwników toksynami paraliżującymi ich ciało i zmysły.',
                statsMultiplier: { hp: 12, mp: 10, patk: 2.2, matk: 1.8, def: 1.1 },
                promotions: ['PlagueMonarch'],
                requirements: { level: 30, stats: { dex: 30, luk: 30 } }
            },
            'Sniper': {
                id: 'Sniper',
                name: 'Snajper',
                tier: 2,
                desc: 'Jedno trafienie, jeden trup. Ekstremalny zasięg i obrażenia krytyczne.',
                statsMultiplier: { hp: 11, mp: 8, patk: 2.6, matk: 0.5, def: 1.0 },
                promotions: ['WindRunner'],
                requirements: { level: 30, stats: { dex: 40, str: 15 } }
            },
            'Beastmaster': {
                id: 'Beastmaster',
                name: 'Władca Bestii',
                tier: 2,
                desc: 'Ujarzmia najdziksze potwory, by walczyły w jego drużynie.',
                statsMultiplier: { hp: 14, mp: 10, patk: 2.0, matk: 1.0, def: 1.4 },
                promotions: ['MonarchOfTheWilds'],
                requirements: { level: 30, stats: { dex: 30, str: 25 } }
            },
            'Priest': {
                id: 'Priest',
                name: 'Kapłan',
                tier: 2,
                desc: 'Najpotężniejsza klasa lecznicza. Zdolna uratować sojuszników znad krawędzi śmierci.',
                statsMultiplier: { hp: 13, mp: 15, patk: 0.8, matk: 2.2, def: 1.3 },
                promotions: ['Archcleric'],
                requirements: { level: 30, stats: { wis: 35, vit: 20 } }
            },
            'Monk': {
                id: 'Monk',
                name: 'Mnich',
                tier: 2,
                desc: 'Łączy sztuki walki ze świętą magią. Równie dobrze bije, co leczy.',
                statsMultiplier: { hp: 16, mp: 10, patk: 2.2, matk: 1.6, def: 1.6 },
                promotions: ['DivineMonarch'],
                requirements: { level: 30, stats: { str: 25, wis: 25, vit: 20 } }
            },

            // Level 70+: Tier 3 Monarchs (Endgame)
            'DoomMonarch': { id: 'DoomMonarch', name: 'Monarcha Zagłady', tier: 3, desc: 'Wcielenie destrukcji i furii bojowej.', statsMultiplier: { hp: 28, mp: 8, patk: 4.5, matk: 0.5, def: 1.8 } },
            'Paladin': { id: 'Paladin', name: 'Paladyn', tier: 3, desc: 'Święty obrońca, niewzruszony bastion.', statsMultiplier: { hp: 32, mp: 12, patk: 2.2, matk: 1.8, def: 3.8 } },
            'Archmage': { id: 'Archmage', name: 'Arcymag', tier: 3, desc: 'Władca czystej esencji magicznej i destrukcji masowej.', statsMultiplier: { hp: 12, mp: 30, patk: 0.5, matk: 5.5, def: 1.0 } },
            'VoidMonarch': { id: 'VoidMonarch', name: 'Monarcha Pustki', tier: 3, desc: 'Kontroluje armię przywołańców i magię przestrzeni.', statsMultiplier: { hp: 16, mp: 24, patk: 1.5, matk: 4.2, def: 1.6 } },
            'MonarchOfShadows': { id: 'MonarchOfShadows', name: 'Monarcha Cieni', tier: 3, desc: 'Legendarny zabójca, który porusza się w mroku i eliminuje cele w ułamku sekundy.', statsMultiplier: { hp: 15, mp: 18, patk: 4.2, matk: 2.0, def: 1.4 } },
            'PlagueMonarch': { id: 'PlagueMonarch', name: 'Monarcha Plagi', tier: 3, desc: 'Ssie życie z wrogów za pomocą chmur niszczącej toksyny.', statsMultiplier: { hp: 18, mp: 18, patk: 3.5, matk: 3.0, def: 1.6 } },
            'WindRunner': { id: 'WindRunner', name: 'Władca Wiatru (Wind Runner)', tier: 3, desc: 'Najszybszy łowca dystansowy na świecie. Ciosy omijają każdy pancerz.', statsMultiplier: { hp: 15, mp: 12, patk: 4.0, matk: 1.0, def: 1.5 } },
            'MonarchOfTheWilds': { id: 'MonarchOfTheWilds', name: 'Monarcha Puszczy', tier: 3, desc: 'Wspólnie z potężnymi chowańcami tworzy niepowstrzymaną falę dzikiej siły.', statsMultiplier: { hp: 20, mp: 15, patk: 3.5, matk: 1.8, def: 2.2 } },
            'Archcleric': { id: 'Archcleric', name: 'Arcykapłan', tier: 3, desc: 'Boski cudotwórca. Potrafi wskrzeszać sojuszników i rzucać niezniszczalne aury.', statsMultiplier: { hp: 18, mp: 25, patk: 1.0, matk: 3.5, def: 1.8 } },
            'DivineMonarch': { id: 'DivineMonarch', name: 'Boski Monarcha', tier: 3, desc: 'Połączenie nieskazitelnego ciała wojownika z kosmiczną mocą wiary.', statsMultiplier: { hp: 24, mp: 15, patk: 3.8, matk: 2.8, def: 2.4 } }
        };
    }

    /**
     * Helper to verify if character meets class change requirements.
     */
    canPromote(character, classId) {
        const targetClass = this.classes[classId];
        if (!targetClass) return { success: false, reason: 'Klasa nie istnieje.' };

        if (character.level < (targetClass.requirements?.level || 0)) {
            return {
                success: false,
                reason: `Wymagany poziom: ${targetClass.requirements.level} (Posiadasz: ${character.level})`
            };
        }

        if (targetClass.requirements?.stats) {
            for (let stat in targetClass.requirements.stats) {
                if ((character.stats[stat] || 0) < targetClass.requirements.stats[stat]) {
                    return {
                        success: false,
                        reason: `Wymagana statystyka: ${stat.toUpperCase()} na poziomie ${targetClass.requirements.stats[stat]} (Posiadasz: ${character.stats[stat]})`
                    };
                }
            }
        }

        return { success: true };
    }

    /**
     * Performs a class change for a character, adjusting state variables.
     */
    promoteCharacter(charId, classId) {
        let character;
        
        if (charId === 'player') {
            character = window.gameState.state.player;
        } else {
            character = window.gameState.state.companions[charId];
        }

        if (!character) return { success: false, reason: 'Postać nie istnieje.' };

        const check = this.canPromote(character, classId);
        if (!check.success) return check;

        character.currentClass = classId;
        window.gameState.save();

        return {
            success: true,
            className: this.classes[classId].name,
            desc: this.classes[classId].desc
        };
    }

    /**
     * Calculates derived dynamic stats (HP, MP, Attack power) based on stats, class, talent, and prestige upgrades.
     */
    calculateDerivedStats(character) {
        const classData = this.classes[character.currentClass] || this.classes['Novice'];
        const mult = classData.statsMultiplier;

        const str = character.stats.str;
        const dex = character.stats.dex;
        const vit = character.stats.vit;
        const int = character.stats.int;
        const wis = character.stats.wis;
        const luk = character.stats.luk;

        let maxHp = Math.floor(vit * mult.hp + str * 2);
        let maxMp = Math.floor(int * mult.mp + wis * 2);
        let patk = Math.floor(str * mult.patk + dex * 0.5);
        let matk = Math.floor(int * mult.matk + wis * 0.5);
        let def = Math.floor(vit * mult.def * 0.5 + str * 0.2);
        let dodge = Math.min(30, (dex * 0.05));
        let critRate = Math.min(60, 5 + (dex * 0.08) + (luk * 0.02));
        let critDmg = 150 + (luk * 0.2);
        let cooldownRed = Math.min(40, (wis * 0.1) + (dex * 0.05));

        // Apply item-specific derived stats from all equipped gear
        if (character.equippedGear) {
            for (let slot in character.equippedGear) {
                const gear = character.equippedGear[slot];
                if (gear && gear.derived) {
                    if (gear.derived.hp) maxHp += gear.derived.hp;
                    if (gear.derived.mp) maxMp += gear.derived.mp;
                    if (gear.derived.patk) patk += gear.derived.patk;
                    if (gear.derived.matk) matk += gear.derived.matk;
                    if (gear.derived.def) def += gear.derived.def;
                    if (gear.derived.crit) critRate = Math.min(60, critRate + gear.derived.crit);
                    if (gear.derived.dodge) dodge = Math.min(30, dodge + gear.derived.dodge);
                    if (gear.derived.cd) cooldownRed = Math.min(40, cooldownRed + gear.derived.cd);
                }
            }
        }

        // Apply Player Specific Talent and Prestige passive multipliers
        if (character.talent !== undefined) { // Check if it's the main character state
            const talent = character.talent;
            const prestigeState = window.gameState.state ? window.gameState.state.prestige : null;
            const upgrades = prestigeState ? prestigeState.upgrades : { power: 0, haste: 0 };

            // 1. Initial Talent modification
            if (talent === 'talent_blood') maxHp = Math.floor(maxHp * 1.15); // +15% HP
            if (talent === 'talent_well') maxMp = Math.floor(maxMp * 1.15); // +15% MP
            if (talent === 'talent_focus') cooldownRed = Math.min(40, cooldownRed + 10); // +10% Haste
            if (talent === 'talent_crit') critRate = Math.min(60, critRate + 5); // +5% Crit

            // 2. Prestige permanent upgrades modification
            if (upgrades.power > 0) {
                const powerMult = 1.0 + (upgrades.power * 0.25); // +25% DMG per level
                patk = Math.floor(patk * powerMult);
                matk = Math.floor(matk * powerMult);
            }
            if (upgrades.haste > 0) {
                cooldownRed = Math.min(40, cooldownRed + (upgrades.haste * 5)); // +5% Haste per level
            }
        }

        return {
            maxHp,
            maxMp,
            patk,
            matk,
            def,
            dodge,
            critRate,
            critDmg,
            cooldownRed
        };
    }
}

window.classSystem = new ClassSystem();
