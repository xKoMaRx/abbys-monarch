/**
 * Abyss Monarch - Dungeon Gates and Party Combat Engine (Loot & Prestige Update)
 * Manages dungeon ranks, procedural wave ticks, AI roles, and the 5-tier RNG Loot Generator.
 */

class DungeonsSystem {
    constructor() {
        this.gates = {
            'gate_e_01': {
                id: 'gate_e_01',
                name: 'Zabłocone Jaskinie Zombie',
                rank: 'E',
                waves: 3,
                recommendedLvl: 1,
                mobTemplate: { name: 'Młody Zombie', hp: 130, patk: 16, def: 3 },
                boss: { name: 'Olbrzymi Zombie Golem', hp: 380, patk: 32, def: 6 },
                rewards: { goldMin: 40, goldMax: 80, crystalsMin: 1, crystalsMax: 3, exp: 50 }
            },
            'gate_d_01': {
                id: 'gate_d_01',
                name: 'Loch Gobliniego Wodza',
                rank: 'D',
                waves: 3,
                recommendedLvl: 8,
                mobTemplate: { name: 'Goblin Wojownik', hp: 320, patk: 36, def: 8 },
                boss: { name: 'Goblini Wódz', hp: 1100, patk: 78, def: 18 },
                rewards: { goldMin: 180, goldMax: 280, crystalsMin: 5, crystalsMax: 10, exp: 180 }
            },
            'gate_c_01': {
                id: 'gate_c_01',
                name: 'Katakumby Nieumarłych Rycerzy',
                rank: 'C',
                waves: 4,
                recommendedLvl: 20,
                mobTemplate: { name: 'Szkielet Wojownik', hp: 850, patk: 92, def: 25 },
                boss: { name: 'Upadły Lich', hp: 3600, patk: 220, def: 52 },
                rewards: { goldMin: 600, goldMax: 950, crystalsMin: 12, crystalsMax: 20, exp: 600 }
            },
            'gate_b_01': {
                id: 'gate_b_01',
                name: 'Wyżyny Żelaznych Golemów',
                rank: 'B',
                waves: 4,
                recommendedLvl: 35,
                mobTemplate: { name: 'Runiczny Golem', hp: 2200, patk: 230, def: 80 },
                boss: { name: 'Rdzawy Golem Stalowy', hp: 9500, patk: 560, def: 154 },
                rewards: { goldMin: 1500, goldMax: 2500, crystalsMin: 30, crystalsMax: 50, exp: 1500 }
            },
            'gate_a_01': {
                id: 'gate_a_01',
                name: 'Legowisko Czerwonego Smoka',
                rank: 'A',
                waves: 4,
                recommendedLvl: 55,
                mobTemplate: { name: 'Smoczy Jaszczuroczłek', hp: 5500, patk: 540, def: 150 },
                boss: { name: 'Czerwony Smok Drake', hp: 24000, patk: 1380, def: 300 },
                rewards: { goldMin: 4500, goldMax: 7500, crystalsMin: 80, crystalsMax: 150, exp: 4500 }
            },
            'gate_s_01': {
                id: 'gate_s_01',
                name: 'Brama Cienia Monarchów',
                rank: 'S',
                waves: 5,
                recommendedLvl: 75,
                mobTemplate: { name: 'Żołnierz Pustki', hp: 15000, patk: 1200, def: 400 },
                boss: { name: 'Generał Pustki Bellion', hp: 65000, patk: 3200, def: 800 },
                rewards: { goldMin: 15000, goldMax: 25000, crystalsMin: 250, crystalsMax: 400, exp: 18000 }
            }
        };

        // Battle state trackers
        this.battleActive = false;
        this.activeParty = [];
        this.monsters = [];
        this.currentWave = 1;
        this.totalWaves = 3;
        this.gateType = 'standard'; // 'standard', 'red_gate', 'double_dungeon'
        this.sectors = [];
        this.battleLog = [];
    }

    /**
     * Prepares party stats, applying active class multipliers and synergy relationships
     */
    prepareBattleParty() {
        const state = window.gameState.state;
        const party = [];

        // 1. Gather player stats
        const playerClass = state.player.currentClass;
        const playerStats = window.classSystem.calculateDerivedStats(state.player);
        party.push({
            id: 'player',
            name: state.player.name,
            classId: playerClass,
            level: state.player.level,
            maxHp: playerStats.maxHp,
            hp: state.player.hp !== undefined ? state.player.hp : playerStats.maxHp,
            maxMp: playerStats.maxMp,
            mp: state.player.mp !== undefined ? state.player.mp : playerStats.maxMp,
            derived: playerStats,
            skills: state.player.skills,
            equippedSkills: state.player.equippedSkills,
            aggro: 10,
            cooldowns: {},
            actionGauge: Math.floor(Math.random() * 30)
        });

        // 2. Gather permanent companion stats
        state.party.forEach(id => {
            if (id === 'player') return;

            const companion = state.companions[id];
            if (companion && companion.recruited) {
                const derived = window.classSystem.calculateDerivedStats(companion);
                
                let synergyDmgBuff = 1.0;
                let synergyHealBuff = 1.0;
                if (companion.affection >= 60) {
                    if (id === 'min_ah') {
                        synergyDmgBuff = 1.15; 
                    } else if (id === 'yu_na') {
                        synergyHealBuff = 1.20; 
                    }
                }

                party.push({
                    id: companion.id,
                    name: companion.name,
                    classId: companion.currentClass,
                    level: companion.level,
                    maxHp: derived.maxHp,
                    hp: companion.hp !== undefined ? companion.hp : derived.maxHp,
                    maxMp: derived.maxMp,
                    mp: companion.mp !== undefined ? companion.mp : derived.maxMp,
                    derived: derived,
                    skills: companion.skills,
                    equippedSkills: companion.equippedSkills,
                    aggro: companion.baseClass === 'Warrior' ? 30 : 10, 
                    synergyDmgBuff: synergyDmgBuff,
                    synergyHealBuff: synergyHealBuff,
                    cooldowns: {},
                    actionGauge: Math.floor(Math.random() * 30)
                });
            }
        });

        // 3. Gather hired mercenaries
        state.mercenaries.forEach(mercenary => {
            party.push({
                id: mercenary.id,
                name: `${mercenary.name} (Najemnik)`,
                classId: mercenary.classId,
                level: mercenary.level,
                maxHp: mercenary.maxHp,
                hp: mercenary.maxHp,
                maxMp: mercenary.maxMp,
                mp: mercenary.maxMp,
                derived: mercenary.derived,
                skills: mercenary.skills,
                equippedSkills: mercenary.equippedSkills,
                aggro: mercenary.classId === 'Warrior' ? 30 : 10,
                cooldowns: {},
                isMercenary: true,
                actionGauge: Math.floor(Math.random() * 30)
            });
        });

        return party;
    }

    /**
     * Initializes a new Dungeon Gate battle
     */
    startGate(gateId) {
        const state = window.gameState.state;
        if (state && state.player.hp !== undefined && state.player.hp <= 0) {
            alert('Twój bohater jest nieprzytomny (0 HP). Odpocznij w Mieszkaniu lub poczekaj na pasywną regenerację, aby odzyskać zdrowie!');
            return false;
        }

        const gate = this.gates[gateId];
        if (!gate) return false;

        this.battleActive = true;
        this.activeParty = this.prepareBattleParty();
        this.currentWave = 1;

        // Deciding Gate Type / Layout based on Rank
        this.gateType = 'standard';
        const rollType = Math.random() * 100;
        if (gate.rank !== 'E') {
            if (gate.rank === 'D') {
                if (rollType > 82) this.gateType = 'red_gate'; // 18% for Red Gate
            } else {
                // Ranks C, B, A, S
                if (rollType > 88) {
                    this.gateType = 'double_dungeon'; // 12% Double Dungeon
                } else if (rollType > 70) {
                    this.gateType = 'red_gate'; // 18% Red Gate
                }
            }
        }

        // Sector count determination based on Rank and layout type
        let baseSectorsCount = 2;
        if (gate.rank === 'E') baseSectorsCount = 2; // 1 standard sector + 1 Boss room
        else if (gate.rank === 'D') baseSectorsCount = 2 + Math.floor(Math.random() * 2); // 2-3 sectors total
        else if (gate.rank === 'C') baseSectorsCount = 2 + Math.floor(Math.random() * 2); // 2-3 sectors total
        else if (gate.rank === 'B') baseSectorsCount = 3 + Math.floor(Math.random() * 2); // 3-4 sectors total
        else if (gate.rank === 'A') baseSectorsCount = 3 + Math.floor(Math.random() * 3); // 3-5 sectors total
        else if (gate.rank === 'S') baseSectorsCount = 4 + Math.floor(Math.random() * 3); // 4-6 sectors total

        this.totalWaves = baseSectorsCount;

        // Names list for sectors based on gate bosses and monsters
        const sectorNames = [];
        const isZombie = gate.mobTemplate.name.includes("Zombie");
        const isGoblin = gate.mobTemplate.name.includes("Goblin");
        const isSkeleton = gate.mobTemplate.name.includes("Szkielet");
        const isGolem = gate.mobTemplate.name.includes("Golem");
        const isDragon = gate.mobTemplate.name.includes("Jaszczuroczłek") || gate.mobTemplate.name.includes("Smoczy");
        const isVoid = gate.mobTemplate.name.includes("Pustki");

        let themes = ["Mroczna Jaskinia", "Zrujnowany Korytarz", "Zasypany Sektor"];
        if (isZombie) themes = ["Gnijące Składowisko", "Zalane Kanały Jaskini", "Wilgotna Krypta", "Korytarz Ciał"];
        else if (isGoblin) themes = ["Kopalnia Kryształów", "Spiżarnia Zielonoskórych", "Skalny Taras", "Ufortyfikowany Posterunek"];
        else if (isSkeleton) themes = ["Katakumby Cierpienia", "Sanktuarium Kości", "Grobowiec Dawnych Rycerzy", "Korytarz Szeptów Podziemi"];
        else if (isGolem) themes = ["Runiczna Pracownia", "Mechaniczny Przedsionek", "Zasypany Sektor Kryształów", "Zapomniana Kuźnia"];
        else if (isDragon) themes = ["Wulkaniczna Rozpadlina", "Płonące Tarasy Bramy", "Smocze Gniazdo Skał", "Korytarz Magmowy"];
        else if (isVoid) themes = ["Pustka Monarchów", "Zakrzywienie Czasoprzestrzeni", "Granica Sfery Cieni", "Sektor Śmiertelnej Ciszy"];

        if (this.gateType === 'red_gate') {
            themes = ["Zamarznięty Las Polarny", "Śnieżna Rozpadlina", "Wichura Mroźnego Wichru", "Lodowy Labirynt Bez Powrotu"];
        } else if (this.gateType === 'double_dungeon') {
            themes = ["Ukryte Przejście Świątyni", "Przedsionek Cartenon", "Sala Kolosalnych Posągów", "Zrujnowany Ołtarz Zasad"];
        }

        // Generate names for each pre-boss sector
        for (let s = 1; s < this.totalWaves; s++) {
            const avail = themes.filter(name => !sectorNames.includes(name));
            const pick = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : themes[Math.floor(Math.random() * themes.length)];
            sectorNames.push(pick);
        }
        // Last sector is always the Boss Room
        if (this.gateType === 'double_dungeon') {
            sectorNames.push("Święte Sanktuarium Boga");
        } else {
            sectorNames.push("Główna Komnata Bosa");
        }

        this.sectors = sectorNames;

        let typeLabel = "ZWYKŁA BRAMA";
        if (this.gateType === 'red_gate') typeLabel = "🔴 CZERWONA BRAMA (IZOLACJA - TRUDNIEJSI WROGOWIE, LEPSZE NAGRODY!)";
        if (this.gateType === 'double_dungeon') typeLabel = "👁️ PODWÓJNY LOCH (ŚWIĄTYNIA ARCHITEKTA - BARDZO WYSOKIE DOŚWIADCZENIE!)";

        this.battleLog = [`[SYSTEM] Rozpoczęto rajd w Bramie: ${gate.name} (Ranga ${gate.rank})`];
        this.battleLog.push(`[DETEKTOR SYGNAŁU] Typ Bramy: ${typeLabel}`);
        
        window.gameState.state.world.currentGate = gateId;
        window.gameState.save();

        this.spawnWave(gateId);
        return true;
    }

    /**
     * Generates a wave of monsters or the boss
     */
    spawnWave(gateId) {
        const gate = this.gates[gateId];
        this.monsters = [];

        const isLastWave = this.currentWave === this.totalWaves;
        const currentSectorName = this.sectors[this.currentWave - 1] || "Sektor Jaskini";

        if (!isLastWave) {
            // Pre-boss battles
            const isDoubleDungeon = this.gateType === 'double_dungeon';
            const isRedGate = this.gateType === 'red_gate';

            // 25% chance to spawn an Elite on this sector (pre-boss)
            const isEliteSpawn = Math.random() < 0.25;

            // Randomized count of enemies: 1 to 3 enemies pre-boss
            const numMobs = 1 + Math.floor(Math.random() * 2);

            for (let i = 1; i <= numMobs; i++) {
                let mobName = "";
                let hp = gate.mobTemplate.hp;
                let patk = gate.mobTemplate.patk;
                let def = gate.mobTemplate.def;

                if (isDoubleDungeon) {
                    mobName = `Ożywiony Posąg Wojownika ${String.fromCharCode(64 + i)}`;
                    hp = Math.floor(hp * 1.15);
                    patk = Math.floor(patk * 1.05);
                } else if (isEliteSpawn && i === 1) {
                    mobName = `[ELITARNY] ${gate.mobTemplate.name}`;
                    hp = Math.floor(hp * 1.55);
                    patk = Math.floor(patk * 1.25);
                    def = Math.floor(def * 1.20);
                } else {
                    mobName = `${gate.mobTemplate.name} ${String.fromCharCode(64 + i)}`;
                }

                // Apply Red Gate stat mutations (+25% HP, +20% ATK, +15% DEF)
                if (isRedGate) {
                    hp = Math.floor(hp * 1.25);
                    patk = Math.floor(patk * 1.20);
                    def = Math.floor(def * 1.15);
                    mobName = `[Skażony] ${mobName}`;
                }

                // Dynamic HP fluctuation
                const finalHp = Math.floor(hp * (0.9 + Math.random() * 0.2));

                this.monsters.push({
                    name: mobName,
                    hp: finalHp,
                    maxHp: finalHp,
                    patk: patk,
                    def: def,
                    isElite: isEliteSpawn && i === 1 && !isDoubleDungeon,
                    isStatue: isDoubleDungeon,
                    actionGauge: Math.floor(Math.random() * 30)
                });
            }

            this.battleLog.push(`[SEKTOR ${this.currentWave}/${this.totalWaves}] Wchodzisz do: "${currentSectorName}". Czeka tu na Ciebie ${numMobs} przeciwników!`);
        } else {
            // Final Boss Battle
            const bossTemplate = gate.boss;
            let bossName = bossTemplate.name;
            let hp = bossTemplate.hp;
            let patk = bossTemplate.patk;
            let def = bossTemplate.def;

            if (this.gateType === 'red_gate') {
                bossName = `🚨 [ZMUTOWANY] Arcydemon ${bossTemplate.name}`;
                hp = Math.floor(hp * 1.30);
                patk = Math.floor(patk * 1.25);
                def = Math.floor(def * 1.15);
            } else if (this.gateType === 'double_dungeon') {
                bossName = `👁️ Posąg Boga (Wielki Strażnik Ołtarza)`;
                hp = Math.floor(hp * 1.40);
                patk = Math.floor(patk * 1.30);
                def = Math.floor(def * 1.20);
            }

            this.monsters.push({
                name: bossName,
                hp: hp,
                maxHp: hp,
                patk: patk,
                def: def,
                isBoss: true,
                actionGauge: Math.floor(Math.random() * 30)
            });

            this.battleLog.push(`[KOMNATA OSTATECZNA] Docierasz do: "${currentSectorName}". Pojawia się boss sekcji: ${bossName}!`);
        }
    }

    /**
     * Generates a procedural gear with random prefix, type, rarity, and stats
     */
    generateRNGGear(rank, rollBonus = 0) {
        const rarities = ['Szary', 'Zielony', 'Niebieski', 'Fioletowy', 'Pomarańczowy'];
        const rolls = Math.random() * 100 + rollBonus;
        
        let rarity = 'Szary';
        if (rolls > 99) rarity = 'Pomarańczowy';      // 1% Legendary
        else if (rolls > 95) rarity = 'Fioletowy';    // 4% Epic
        else if (rolls > 85) rarity = 'Niebieski';     // 10% Rare
        else if (rolls > 60) rarity = 'Zielony';      // 25% Uncommon

        const types = ['head', 'chest', 'pants', 'boots', 'shoulder', 'glove', 'belt', 'cape', 'ring', 'weapon', 'shield'];
        const chosenType = types[Math.floor(Math.random() * types.length)];

        // Naming lists
        const prefixes = ['Płonący', 'Mroźny', 'Widmowy', 'Zwiastun', 'Monarchy', 'Arcy-magiczny', 'Przeklęty', 'Niebiański', 'Runiczny', 'Otchłani', 'Cienia', 'Tytana'];
        
        const bases = {
            head: ['Hełm', 'Kaptur', 'Korona', 'Czapka'],
            chest: ['Kaftan', 'Pancerz Klatki', 'Szata', 'Napierśnik'],
            pants: ['Spodnie', 'Gacie', 'Nogawice'],
            boots: ['Buty', 'Trzewiki', 'Kamasze'],
            shoulder: ['Naramienniki', 'Naramiennik'],
            glove: ['Rękawice', 'Rękawice Bojowe'],
            belt: ['Pas', 'Szarfa'],
            cape: ['Peleryna', 'Płaszcz'],
            ring: ['Sygnet', 'Pierścień', 'Amulet'],
            weapon: ['Kostur', 'Miecz', 'Sztylet', 'Łuk', 'Saber'],
            shield: ['Tarcza', 'Puklerz']
        };

        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const baseList = bases[chosenType];
        const base = baseList[Math.floor(Math.random() * baseList.length)];
        const gearName = `${prefix} ${base}`;

        // Assign stats based on rarity and rank factor
        const stats = { str: 0, dex: 0, vit: 0, int: 0, wis: 0, luk: 0 };
        const derived = { hp: 0, mp: 0, patk: 0, matk: 0, crit: 0 };

        const rankFactor = rank === 'E' ? 1 : (rank === 'D' ? 2 : (rank === 'C' ? 4 : (rank === 'B' ? 8 : (rank === 'A' ? 12 : 20))));
        
        if (rarity === 'Zielony') {
            const stat = ['str', 'dex', 'vit', 'int', 'wis'][Math.floor(Math.random() * 5)];
            stats[stat] = 1 * rankFactor;
        } else if (rarity === 'Niebieski') {
            const stat = ['str', 'dex', 'vit', 'int', 'wis'][Math.floor(Math.random() * 5)];
            stats[stat] = 2 * rankFactor;
            derived.crit = 2; // +2% crit
        } else if (rarity === 'Fioletowy') {
            const statA = ['str', 'vit', 'int'][Math.floor(Math.random() * 3)];
            const statB = ['dex', 'wis', 'luk'][Math.floor(Math.random() * 3)];
            stats[statA] = 4 * rankFactor;
            stats[statB] = 4 * rankFactor;
            derived.crit = 4;
        } else if (rarity === 'Pomarańczowy') {
            stats.str = 8 * rankFactor;
            stats.int = 8 * rankFactor;
            stats.vit = 8 * rankFactor;
            derived.crit = 8;
            derived.patk = 25 * rankFactor;
        }

        return {
            id: `gear_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            name: gearName,
            rarity: rarity,
            type: chosenType,
            stats: stats,
            derived: derived
        };
    }

    /**
     * Helper to retrieve base action-charge speed of monsters
     */
    getMonsterSpeed(monster) {
        let speed = 12;
        if (monster.isBoss) {
            if (monster.name.includes("Smok")) speed = 18;
            else if (monster.name.includes("Bellion")) speed = 22;
            else if (monster.name.includes("Golem")) speed = 11;
            else speed = 16;
        } else {
            if (monster.name.includes("Goblin")) speed = 15;
            else if (monster.name.includes("Zombie")) speed = 9;
            else if (monster.name.includes("Szkielet")) speed = 12;
            else if (monster.name.includes("Golem")) speed = 8;
            else if (monster.name.includes("Jaszczuroczłek")) speed = 14;
            else if (monster.name.includes("Żołnierz")) speed = 16;
            else if (monster.name.includes("Posąg")) speed = 14;
        }

        if (monster.isElite) speed += 3;
        if (this.gateType === 'red_gate') speed += 2;
        return speed;
    }

    /**
     * Simulates one single combat tick
     */
    simulateTick(gateId) {
        if (!this.battleActive) return;

        const gate = this.gates[gateId];
        const log = [];

        // 1. Charge Action Bars for Allies and Monsters
        this.activeParty.forEach(ally => {
            if (ally.hp <= 0) return;
            const dex = (ally.derived && ally.derived.dex) ? ally.derived.dex : (ally.level * 2);
            const cooldownRed = (ally.derived && ally.derived.cooldownRed) ? ally.derived.cooldownRed : 0;
            const hasteMult = 1 + cooldownRed / 100;
            const speed = (18 + dex * 0.15) * hasteMult;
            ally.actionGauge = Math.min(100, (ally.actionGauge || 0) + speed);
        });

        this.monsters.forEach(monster => {
            if (monster.hp <= 0) return;
            const speed = this.getMonsterSpeed(monster);
            monster.actionGauge = Math.min(100, (monster.actionGauge || 0) + speed);
        });

        // 2. Process Allies whose action gauge reaches 100
        this.activeParty.forEach(ally => {
            if (ally.hp <= 0) return;
            if ((ally.actionGauge || 0) < 100) return;

            // Consume points
            ally.actionGauge -= 100;

            // Auto-use HP potion if below 35% HP
            const hpPotions = window.gameState.state.inventory.hpPotions !== undefined ? window.gameState.state.inventory.hpPotions : 0;
            if (ally.hp / ally.maxHp < 0.35 && hpPotions > 0) {
                const healAmt = Math.floor(ally.maxHp * 0.40);
                ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);
                window.gameState.state.inventory.hpPotions--;
                log.push(`[PRZEDMIOT] ${ally.name} automatycznie wypija Miksturę Zdrowia (HP < 35%), przywracając +${healAmt} HP!`);
                window.gameState.save();
            }

            // Auto-use MP potion if below 20% MP
            const mpPotions = window.gameState.state.inventory.mpPotions !== undefined ? window.gameState.state.inventory.mpPotions : 0;
            if (ally.mp / ally.maxMp < 0.20 && mpPotions > 0) {
                const mpAmt = Math.floor(ally.maxMp * 0.40);
                ally.mp = Math.min(ally.maxMp, ally.mp + mpAmt);
                window.gameState.state.inventory.mpPotions--;
                log.push(`[PRZEDMIOT] ${ally.name} automatycznie wypija Miksturę Many (MP < 20%), przywracając +${mpAmt} MP!`);
                window.gameState.save();
            }

            let skillToUse = null;

            ally.equippedSkills.forEach(skillId => {
                const skill = window.skillsSystem.skills[skillId];
                if (!skill) return;

                const now = Date.now();
                if (ally.cooldowns[skillId] && ally.cooldowns[skillId] > now) return;

                if (ally.mp < skill.mpCost) return;

                if (skill.effect === 'heal' || skill.effect === 'heal_shield') {
                    const damagedAlly = this.activeParty.find(a => a.hp > 0 && a.hp / a.maxHp < 0.75);
                    if (damagedAlly) {
                        skillToUse = skillId;
                    }
                } else if (skill.effect === 'taunt') {
                    const bossActive = this.monsters.some(m => m.isBoss);
                    if (bossActive) {
                        skillToUse = skillId;
                    }
                } else {
                    skillToUse = skillId;
                }
            });

            if (skillToUse) {
                const skill = window.skillsSystem.skills[skillToUse];
                ally.mp -= skill.mpCost;
                
                const cdReduction = ally.derived.cooldownRed || 0;
                const actualCooldown = skill.cooldown * (1 - cdReduction / 100);
                ally.cooldowns[skillToUse] = Date.now() + actualCooldown * 1000;

                if (skill.effect === 'heal') {
                    let target = this.activeParty
                        .filter(a => a.hp > 0)
                        .sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];

                    if (target) {
                        const healAmount = Math.floor(skill.formula(ally, 1) * (ally.synergyHealBuff || 1.0));
                        target.hp = Math.min(target.maxHp, target.hp + healAmount);
                        log.push(`[WALKA] ${ally.name} rzuca [${skill.name}] i leczy ${target.name} o +${healAmount} HP.`);
                    }
                } else if (skill.effect === 'taunt') {
                    ally.aggro += 50;
                    log.push(`[WALKA] ${ally.name} rzuca [Prowokacja] gromadząc na sobie całe agro!`);
                } else {
                    const target = this.monsters.find(m => m.hp > 0);
                    if (target) {
                        const rawDmg = skill.formula(ally, 1) * (ally.synergyDmgBuff || 1.0);
                        const finalDmg = Math.max(1, Math.floor(rawDmg - target.def * 0.3));
                        target.hp = Math.max(0, target.hp - finalDmg);
                        log.push(`[WALKA] ${ally.name} rzuca zaklęcie [${skill.name}] zadając ${finalDmg} obrażeń dla ${target.name}.`);
                        
                        if (target.hp === 0 && !target.expAwarded) {
                            target.expAwarded = true;
                            this.awardMonsterExp(target, gate);
                        }
                    }
                }
            } else {
                const target = this.monsters.find(m => m.hp > 0);
                if (target) {
                    const finalDmg = Math.max(1, Math.floor(ally.derived.patk - target.def * 0.3));
                    target.hp = Math.max(0, target.hp - finalDmg);
                    log.push(`[WALKA] ${ally.name} wyprowadza cios fizyczny, zadając ${finalDmg} obrażeń dla ${target.name}.`);
                    
                    if (target.hp === 0 && !target.expAwarded) {
                        target.expAwarded = true;
                        this.awardMonsterExp(target, gate);
                    }
                }
            }
        });

        // Check if all monsters in this sector died
        const allMonstersDead = this.monsters.every(m => m.hp <= 0);
        if (allMonstersDead) {
            this.currentWave++;
            if (this.currentWave <= this.totalWaves) {
                this.spawnWave(gateId);
            } else {
                // Battle Win!
                this.battleActive = false;
                window.gameState.state.world.currentGate = null;
                
                // Crystals Calculation (Prestige & Talent multipliers apply to crystal yield!)
                let crystalsEarned = Math.floor(gate.rewards.crystalsMin + Math.random() * (gate.rewards.crystalsMax - gate.rewards.crystalsMin));

                // Gate Type modifications for crystal drops
                if (this.gateType === 'red_gate') {
                    crystalsEarned = Math.floor(crystalsEarned * 1.50); // +50% crystals
                } else if (this.gateType === 'double_dungeon') {
                    crystalsEarned = Math.floor(crystalsEarned * 1.25); // +25% crystals
                }

                const goldUpgradeLvl = window.gameState.state.prestige.upgrades.gold || 0;
                const crystalMult = 1.0 + (goldUpgradeLvl * 0.20) + (window.gameState.state.player.talent === 'talent_gold' ? 0.20 : 0.0);
                crystalsEarned = Math.floor(crystalsEarned * crystalMult);

                // Split crystals if mercenaries are present
                const numMercenaries = this.activeParty.filter(a => a.isMercenary).length;
                let mercCutText = "";
                if (numMercenaries > 0) {
                    const cutPercent = numMercenaries * 0.15; 
                    const cutCrystals = Math.floor(crystalsEarned * cutPercent);
                    crystalsEarned -= cutCrystals;
                    mercCutText = ` (Najemnicy pobrali ${cutCrystals} kryształów prowizji)`;
                }

                // Victory Boss loot: 100% guaranteed gear drop on victory with Gate Type roll bonus!
                let gearBonus = 0;
                if (this.gateType === 'red_gate') gearBonus = 5;
                if (this.gateType === 'double_dungeon') gearBonus = 15;
                const gearDropped = this.generateRNGGear(gate.rank, gearBonus);
                window.gameState.state.inventory.gear.push(gearDropped);

                // Additional Gold bonus if Double Dungeon was cleared
                let extraGoldText = "";
                if (this.gateType === 'double_dungeon') {
                    const goldBonus = Math.floor(300 + Math.random() * 1000);
                    window.gameState.addGold(goldBonus);
                    extraGoldText = ` oraz +${goldBonus} Sztuk Złota jako podarek Świątyni`;
                }

                // Save survivor HP and MP back to state
                this.activeParty.forEach(ally => {
                    if (ally.id === 'player') {
                        window.gameState.state.player.hp = ally.hp;
                        window.gameState.state.player.mp = ally.mp;
                    } else if (!ally.isMercenary) {
                        const companion = window.gameState.state.companions[ally.id];
                        if (companion) {
                            companion.hp = ally.hp;
                            companion.mp = ally.mp;
                        }
                    }
                });

                // Apply resources (No gold from monsters except temple gifts!)
                window.gameState.addManaCrystals(crystalsEarned);

                // Clear hired mercenaries from active state
                window.gameState.state.mercenaries = [];
                window.gameState.save();

                log.push(`[SYSTEM] BRAMA OCZYSZCZONA Z SUKCESEM!`);
                log.push(`Otrzymane nagrody: +${crystalsEarned} Kryształów Mana${mercCutText}${extraGoldText}!`);
                log.push(`[SYSTEM - BOSS DROP] ZNALAZŁEŚ PRZEDMIOT: [${gearDropped.rarity}] ${gearDropped.name}!`);

                // Update active quest progress
                const questReport = window.questSystem.checkActiveQuestProgress();
                if (questReport) {
                    log.push(`[ZADANIE UKOŃCZONE] ${questReport.title}! ${questReport.rewardText}`);
                }

                this.battleLog.push(...log);
                return;
            }
        }

        // 3. Process Monsters whose action gauge reaches 100
        this.monsters.forEach(monster => {
            if (monster.hp <= 0) return;
            if ((monster.actionGauge || 0) < 100) return;

            // Consume points
            monster.actionGauge -= 100;

            const target = this.activeParty
                .filter(a => a.hp > 0)
                .sort((a, b) => b.aggro - a.aggro)[0];

            if (target) {
                // Balanced Armor mitigation with constant pierce floor (monsters always deal at least 15% of their attack power)
                const finalDmg = Math.max(Math.floor(monster.patk * 0.15), Math.floor(monster.patk - target.derived.def * 0.28));
                target.hp = Math.max(0, target.hp - finalDmg);
                log.push(`[PRZECIWNIK] ${monster.name} zadaje szybki cios, zadając ${finalDmg} obrażeń dla ${target.name}.`);
            }
        });

        // Check if all allies died
        const allAlliesDead = this.activeParty.every(a => a.hp <= 0);
        if (allAlliesDead) {
            this.battleActive = false;
            window.gameState.state.world.currentGate = null;
            
            // Save survivor HP and MP back to state (all will be 0)
            this.activeParty.forEach(ally => {
                if (ally.id === 'player') {
                    window.gameState.state.player.hp = ally.hp;
                    window.gameState.state.player.mp = ally.mp;
                } else if (!ally.isMercenary) {
                    const companion = window.gameState.state.companions[ally.id];
                    if (companion) {
                        companion.hp = ally.hp;
                        companion.mp = ally.mp;
                    }
                }
            });

            window.gameState.state.mercenaries = []; 
            window.gameState.save();

            log.push(`[SYSTEM] RAJD ZAKOŃCZONY PORAŻKĄ! Odpocznij w mieszkaniu, by odzyskać zdrowie.`);
            this.battleLog.push(...log);
            return;
        }

        if (log.length > 0) {
            this.battleLog.push(...log);
        }
        if (this.battleLog.length > 50) {
            this.battleLog = this.battleLog.slice(this.battleLog.length - 30);
        }
    }

    /**
     * Awards experience dynamically to the player and companions when a monster is defeated.
     */
    awardMonsterExp(monster, gate) {
        let expAwarded = 0;
        const totalW = this.totalWaves || gate.waves || 3;
        
        if (monster.isBoss) {
            expAwarded = Math.floor(gate.rewards.exp * 0.5);
        } else {
            const denom = Math.max(1, (totalW - 1) * 2.5);
            expAwarded = Math.floor((gate.rewards.exp * 0.5) / denom);
        }

        // Apply Gate Type EXP multipliers
        if (this.gateType === 'red_gate') {
            expAwarded = Math.floor(expAwarded * 1.25);
        } else if (this.gateType === 'double_dungeon') {
            expAwarded = Math.floor(expAwarded * 2.20); // +120% EXP bonus
        }

        expAwarded = Math.max(1, expAwarded);

        // Apply exp to player
        const playerLvlUp = window.gameState.addPlayerExp(expAwarded);
        let lvlUpText = playerLvlUp ? " [BOHATER AWANSOWAŁ!]" : "";

        this.battleLog.push(`[SYSTEM - ZABITO WROGA] ${monster.name} został pokonany. Zdobywasz +${expAwarded} EXP.${lvlUpText}`);

        // Apply exp to companions
        window.gameState.state.party.forEach(id => {
            if (id === 'player') return;
            const companion = window.gameState.state.companions[id];
            if (companion && companion.recruited) {
                companion.exp += expAwarded;
                while (companion.exp >= companion.expNeeded) {
                    companion.exp -= companion.expNeeded;
                    companion.level++;
                    companion.expNeeded = Math.floor(companion.expNeeded * 1.5);
                    this.battleLog.push(`[SYSTEM - TOWARZYSZ AWANSOWAŁ] ${companion.name} awansuje na poziom ${companion.level}!`);
                }
            }
        });

        // Regular monsters drops: 30% chance for 1-2 crystals, 8% chance for random gear
        if (!monster.isBoss) {
            let dropChanceMult = 1.0;
            if (this.gateType === 'red_gate') dropChanceMult = 1.5;
            if (this.gateType === 'double_dungeon') dropChanceMult = 1.8;

            if (Math.random() < (0.30 * dropChanceMult)) {
                let crystals = Math.floor(1 + Math.random() * 2);
                if (this.gateType === 'red_gate') crystals = Math.floor(crystals * 2); // Double pre-boss crystals
                window.gameState.addManaCrystals(crystals);
                this.battleLog.push(`[ŁUP - KRYSZTAŁY] Pokonany wróg upuszcza +${crystals} magicznych kryształów mana!`);
            }
            if (Math.random() < (0.08 * dropChanceMult)) {
                const hpPots = window.gameState.state.inventory.hpPotions !== undefined ? window.gameState.state.inventory.hpPotions : 0;
                const mpPots = window.gameState.state.inventory.mpPotions !== undefined ? window.gameState.state.inventory.mpPotions : 0;
                const slotsUsed = window.gameState.state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
                
                if (slotsUsed < 20) {
                    let gearBonus = 0;
                    if (this.gateType === 'red_gate') gearBonus = 5;
                    if (this.gateType === 'double_dungeon') gearBonus = 15;
                    const gear = this.generateRNGGear(gate.rank, gearBonus);
                    window.gameState.state.inventory.gear.push(gear);
                    this.battleLog.push(`[ŁUP - PRZEDMIOT] Pokonany wróg upuszcza rzadki przedmiot: [${gear.rarity}] ${gear.name}!`);
                }
            }
        }

        // Trigger UI updates
        window.uiEngine.updateHUD();
    }
}

window.dungeonsSystem = new DungeonsSystem();
