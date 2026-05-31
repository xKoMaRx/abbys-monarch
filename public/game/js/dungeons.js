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
        this.isGuestMercenaryRaid = false;
    }

    /**
     * Prepares party stats, applying active class multipliers and synergy relationships
     */
    prepareBattleParty(gateId = null) {
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

        if (!this.isGuestMercenaryRaid) {
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
        } else {
            // Procedurally generate a full Rank-appropriate party for Guest Mercenary Raid
            const selectedGateId = gateId || state.world.currentGate;
            let gate = this.gates[selectedGateId];
            if (!gate && state.world.dynamicGates) {
                gate = state.world.dynamicGates.find(g => g.id === selectedGateId);
            }
            const rank = gate ? gate.rank : 'E';
            const recLvl = gate ? gate.recommendedLvl : 1;
            
            // For Rank E/D: 2 members (total 3), Rank C-S: 3 members (total 4)
            const numTeammates = (rank === 'E' || rank === 'D') ? 2 : 3;
            const namesList = ["Kamil", "Sebastian", "Patryk", "Agata", "Dominika", "Mateusz", "Robert", "Jan", "Grzegorz", "Joanna"];
            const classesPool = [
                { classId: 'Warrior', name: 'Wojownik', skills: ['strike', 'provoke'] },
                { classId: 'Mage', name: 'Czarodziej', skills: ['fireball', 'mana_shield'] },
                { classId: 'Assassin', name: 'Zabójca', skills: ['quick_cut', 'poison_dart'] },
                { classId: 'Ranger', name: 'Strzelec', skills: ['aimed_shot'] },
                { classId: 'Cleric', name: 'Kleryk', skills: ['heal', 'holy_shield'] }
            ];
            
            for (let i = 0; i < numTeammates; i++) {
                const name = namesList[Math.floor(Math.random() * namesList.length)];
                const classObj = classesPool[Math.floor(Math.random() * classesPool.length)];
                const level = Math.max(1, recLvl + Math.floor(Math.random() * 3) - 1);
                
                const baseStat = 12 + level * 3;
                let stats = { str: baseStat, dex: baseStat, vit: baseStat, int: baseStat, wis: baseStat, luk: baseStat };
                if (classObj.classId === 'Warrior') { stats.str += level * 3; stats.vit += level * 2; }
                else if (classObj.classId === 'Mage') { stats.int += level * 3; stats.wis += level * 2; }
                else if (classObj.classId === 'Assassin') { stats.dex += level * 3; stats.luk += level * 2; }
                else if (classObj.classId === 'Ranger') { stats.dex += level * 3; stats.str += level; }
                else if (classObj.classId === 'Cleric') { stats.wis += level * 3; stats.vit += level; }
                
                const dummyChar = { currentClass: classObj.classId, stats: stats, equippedGear: {} };
                const derived = window.classSystem.calculateDerivedStats(dummyChar);
                
                const isLeader = i === 0;
                const roleSuffix = isLeader ? "Lider" : classObj.name;
                
                party.push({
                    id: `temporary_guest_${i}`,
                    name: `${name} (${roleSuffix} - Ranga ${rank})`,
                    classId: classObj.classId,
                    level: level,
                    maxHp: derived.maxHp,
                    hp: derived.maxHp,
                    maxMp: derived.maxMp,
                    mp: derived.maxMp,
                    derived: derived,
                    skills: classObj.skills,
                    equippedSkills: classObj.skills,
                    aggro: classObj.classId === 'Warrior' ? 30 : 10,
                    cooldowns: {},
                    isMercenary: true, // Treated as mercenary so HP/MP is not saved back
                    actionGauge: Math.floor(Math.random() * 30)
                });
            }
        }

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

        let gate = this.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        if (!gate) return false;

        // Verify Reservation & Licencji status
        const isReserved = state.world.reservedGates && state.world.reservedGates[gateId];
        // Dungeon breaks are free and don't require license
        const isDungeonBreak = gate.dynamicType === 'dungeon_break';
        if (!isReserved && !isDungeonBreak && !this.isGuestMercenaryRaid) {
            alert('Ta Brama nie została opłacona lub zarezerwowana! Wykup licencję w panelu przygotowania przed wejściem.');
            return false;
        }

        // AUTO-SAVE & DUNGEON BACKUP before entering!
        // We write a backup key to restore if player dies or decides to escape
        localStorage.setItem(window.gameState.SAVE_KEY + "_dungeon_backup", JSON.stringify(state));
        console.log("[SYSTEM] Wykonano punkt przywracania (Backup) przed wejściem do Bramy.");

        // Clear reservation upon successfully entering
        if (isReserved) {
            delete state.world.reservedGates[gateId];
        }

        this.battleActive = true;
        this.isPaused = false;
        this.escapePromptTriggered = false;
        this.activeParty = this.prepareBattleParty(gateId);
        this.currentWave = 1;

        // Initialize combat stats tracking
        this.combatStats = {
            startTime: Date.now(),
            durationSeconds: 0,
            damageDealt: {},
            damageHealed: {},
            goldEarned: 0,
            expGained: 0,
            manaCrystalsEarned: { E: 0, D: 0, C: 0, B: 0, A: 0, S: 0 },
            itemsObtained: []
        };
        this.activeParty.forEach(ally => {
            this.combatStats.damageDealt[ally.id] = 0;
            this.combatStats.damageHealed[ally.id] = 0;
        });

        // Deciding Gate Type / Layout based on Rank
        this.gateType = gate.dynamicType || 'standard';
        if (!gate.isDynamic) {
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
        const state = window.gameState.state;
        let gate = this.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        this.monsters = [];

        const isLastWave = this.currentWave === this.totalWaves;
        const currentSectorName = this.sectors[this.currentWave - 1] || "Sektor Jaskini";

        if (!isLastWave) {
            // Pre-boss battles
            const isDoubleDungeon = this.gateType === 'double_dungeon';
            const isRedGate = this.gateType === 'red_gate';

            // 25% chance to spawn an Elite on this sector (pre-boss)
            const isEliteSpawn = Math.random() < 0.25;

            // Procedural count of enemies based on Gate Rank: range 2-20 as requested!
            let minMobs = 2;
            let maxMobs = 4;
            if (gate.rank === 'D') { minMobs = 3; maxMobs = 6; }
            else if (gate.rank === 'C') { minMobs = 5; maxMobs = 10; }
            else if (gate.rank === 'B') { minMobs = 7; maxMobs = 13; }
            else if (gate.rank === 'A') { minMobs = 10; maxMobs = 16; }
            else if (gate.rank === 'S') { minMobs = 12; maxMobs = 20; }

            const numMobs = minMobs + Math.floor(Math.random() * (maxMobs - minMobs + 1));

            // Get available rank monsters from database
            const rankMonsters = window.monstersDB ? window.monstersDB.monsters.filter(m => m.rank === gate.rank) : [];

            for (let i = 1; i <= numMobs; i++) {
                let mobName = "";
                let hp = gate.mobTemplate.hp;
                let patk = gate.mobTemplate.patk;
                let def = gate.mobTemplate.def;

                // Pick from 1000 monsters database
                if (rankMonsters.length > 0) {
                    const pickedDb = rankMonsters[Math.floor(Math.random() * rankMonsters.length)];
                    mobName = pickedDb.name;
                    hp = Math.floor(pickedDb.hp * 0.45); // balanced formula for wave health
                    patk = pickedDb.patk;
                    def = pickedDb.def;
                } else {
                    mobName = gate.mobTemplate.name;
                }

                // Swarm balance: Reduce individual HP slightly when facing massive crowds to prevent boring HP sponges
                const swarmScale = Math.max(0.4, 1.25 - (numMobs * 0.045));
                hp = Math.floor(hp * swarmScale);

                if (isDoubleDungeon) {
                    mobName = `Ożywiony Posąg Wojownika ${String.fromCharCode(64 + i)}`;
                    hp = Math.floor(hp * 1.15);
                    patk = Math.floor(patk * 1.05);
                } else if (isEliteSpawn && i === 1) {
                    mobName = `[ELITARNY] ${mobName}`;
                    hp = Math.floor(hp * 1.55);
                    patk = Math.floor(patk * 1.25);
                    def = Math.floor(def * 1.20);
                } else {
                    mobName = `${mobName} ${String.fromCharCode(64 + i)}`;
                }

                // Apply Red Gate stat mutations (+25% HP, +20% ATK, +15% DEF)
                if (isRedGate) {
                    hp = Math.floor(hp * 1.25);
                    patk = Math.floor(patk * 1.20);
                    def = Math.floor(def * 1.15);
                    mobName = `[Skażony] ${mobName}`;
                }

                // Dynamic HP fluctuation
                const finalHp = Math.max(10, Math.floor(hp * (0.9 + Math.random() * 0.2)));

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

            // Pick a high-tier matching rank monster from the 1000 database as Section Boss
            const rankMonsters = window.monstersDB ? window.monstersDB.monsters.filter(m => m.rank === gate.rank) : [];
            if (rankMonsters.length > 0) {
                const sortedRank = [...rankMonsters].sort((a,b) => b.level - a.level);
                const pickedBoss = sortedRank[Math.floor(Math.random() * Math.min(15, sortedRank.length))];
                bossName = pickedBoss.name;
            }

            if (this.gateType === 'red_gate') {
                bossName = `🚨 [ZMUTOWANY] Arcydemon ${bossName}`;
                hp = Math.floor(hp * 1.30);
                patk = Math.floor(patk * 1.25);
                def = Math.floor(def * 1.15);
            } else if (this.gateType === 'double_dungeon') {
                bossName = `👁️ Posąg Boga (Wielki Strażnik Ołtarza)`;
                hp = Math.floor(hp * 1.40);
                patk = Math.floor(patk * 1.30);
                def = Math.floor(def * 1.20);
            } else {
                bossName = `[BOSS Sektora] ${bossName}`;
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
        if (this.isPaused) return;

        const state = window.gameState.state;
        let gate = this.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        if (!gate) return;

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
                        if (this.combatStats) {
                            this.combatStats.damageHealed[ally.id] = (this.combatStats.damageHealed[ally.id] || 0) + healAmount;
                        }
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
                        
                        if (this.combatStats) {
                            this.combatStats.damageDealt[ally.id] = (this.combatStats.damageDealt[ally.id] || 0) + finalDmg;
                        }

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
                    
                    if (this.combatStats) {
                        this.combatStats.damageDealt[ally.id] = (this.combatStats.damageDealt[ally.id] || 0) + finalDmg;
                    }

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
            // Player gains fatigue with each sector cleared
            if (state && state.player) {
                state.player.fatigue = Math.min(100, (state.player.fatigue || 0) + 12);
                log.push(`[SYSTEM] Zwycięstwo w sektorze! Twoje Zmęczenie wzrosło o +12 (Obecnie: ${Math.round(state.player.fatigue)}/100).`);
            }
            this.currentWave++;
            if (this.currentWave <= this.totalWaves) {
                this.spawnWave(gateId);
            } else {
                // Battle Win!
                this.battleActive = false;
                window.gameState.state.world.currentGate = null;

                // Cleanup Dynamic Gate and pay Association Bounty for Dungeon Breaks
                let associationGoldBonus = 0;
                let associationText = "";
                if (gate.isDynamic) {
                    // Suppress or purge from dynamicGates array
                    window.gameState.state.world.dynamicGates = window.gameState.state.world.dynamicGates.filter(g => g.id !== gateId);
                    
                    if (gate.dynamicType === 'dungeon_break' && !this.isGuestMercenaryRaid) {
                        // Calculate gold bonus based on gate rank
                        const rankCosts = { 'E': 120, 'D': 450, 'C': 1600, 'B': 4200, 'A': 12500, 'S': 38000 };
                        associationGoldBonus = Math.floor((rankCosts[gate.rank] || 300) * 1.8);
                        window.gameState.addGold(associationGoldBonus);
                        associationText = ` oraz bonus Stowarzyszenia za walkę z przełomem: +${associationGoldBonus} Złota`;
                    }
                }
                
                // Crystals Calculation (Prestige & Talent multipliers apply to crystal yield!)
                let crystalsEarned = 0;
                let crystalsBypassDistributionText = "";
                
                if (this.isGuestMercenaryRaid) {
                    // Procedural leader shares loot: 50% chance to award 1-2 crystals
                    if (Math.random() < 0.50) {
                        crystalsEarned = (gate.rank === 'E' || gate.rank === 'D') ? 1 : 2;
                        crystalsBypassDistributionText = ` (Lider przyznał Ci ${crystalsEarned} kryształów prowizji)`;
                    } else {
                        crystalsBypassDistributionText = ` (Lider zatrzymał wszystkie kryształy dla grupy uderzeniowej)`;
                    }
                } else {
                    crystalsEarned = Math.floor(gate.rewards.crystalsMin + Math.random() * (gate.rewards.crystalsMax - gate.rewards.crystalsMin));

                    // Gate Type modifications for crystal drops
                    if (this.gateType === 'red_gate') {
                        crystalsEarned = Math.floor(crystalsEarned * 1.50); // +50% crystals
                    } else if (this.gateType === 'double_dungeon') {
                        crystalsEarned = Math.floor(crystalsEarned * 1.25); // +25% crystals
                    }

                    const goldUpgradeLvl = window.gameState.state.prestige.upgrades.gold || 0;
                    const crystalMult = 1.0 + (goldUpgradeLvl * 0.20) + (window.gameState.state.player.talent === 'talent_gold' ? 0.20 : 0.0);
                    crystalsEarned = Math.floor(crystalsEarned * crystalMult);
                }

                // Split crystals if mercenaries are present
                const numMercenaries = this.isGuestMercenaryRaid ? 0 : this.activeParty.filter(a => a.isMercenary).length;
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
                
                let gearDropped = null;
                let gearText = "";
                if (!this.isGuestMercenaryRaid) {
                    gearDropped = this.generateRNGGear(gate.rank, gearBonus);
                    window.gameState.state.inventory.gear.push(gearDropped);
                    if (this.combatStats) {
                        this.combatStats.itemsObtained.push(gearDropped);
                    }
                    gearText = `[SYSTEM - BOSS DROP] ZNALAZŁEŚ PRZEDMIOT: [${gearDropped.rarity}] ${gearDropped.name}!`;
                } else {
                    // Guest Mercenary Mode: 20% chance of a distributed gear drop
                    if (Math.random() < 0.20) {
                        gearDropped = this.generateRNGGear(gate.rank, 0);
                        window.gameState.state.inventory.gear.push(gearDropped);
                        if (this.combatStats) {
                            this.combatStats.itemsObtained.push(gearDropped);
                        }
                        gearText = `[DYSTRYBUCJA] Lider dostrzegł Twój wkład i przekazał Ci: [${gearDropped.rarity}] ${gearDropped.name}!`;
                    } else {
                        gearText = `[DYSTRYBUCJA] Łupy rzadkie z bossa przypadły rdzennym członkom grupy. Lider dziękuje Ci za pomoc.`;
                    }
                }

                // Contract Payment Salary for Hired Mercenary
                let mercenarySalary = 0;
                let extraGoldText = "";
                let goldGift = 0;
                
                if (this.isGuestMercenaryRaid) {
                    const rankBounties = { 'E': 250, 'D': 800, 'C': 2500, 'B': 6000, 'A': 18000, 'S': 50000 };
                    mercenarySalary = rankBounties[gate.rank] || 250;
                    window.gameState.addGold(mercenarySalary);
                    extraGoldText = ` oraz żołd kontraktowy najemnika: +${mercenarySalary} Złota`;
                } else {
                    // Additional Gold bonus if Double Dungeon was cleared
                    if (this.gateType === 'double_dungeon') {
                        goldGift = Math.floor(300 + Math.random() * 1000);
                        window.gameState.addGold(goldGift);
                        extraGoldText = ` oraz +${goldGift} Sztuk Złota jako podarek Świątyni`;
                    }
                    if (associationGoldBonus > 0) {
                        extraGoldText += associationText;
                    }
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

                // Apply resources (No gold from monsters except temple gifts/bounties!)
                if (crystalsEarned > 0) {
                    window.gameState.addManaCrystals(crystalsEarned, gate.rank);
                }
                if (this.combatStats) {
                    this.combatStats.manaCrystalsEarned[gate.rank] = (this.combatStats.manaCrystalsEarned[gate.rank] || 0) + crystalsEarned;
                    this.combatStats.goldEarned += (associationGoldBonus + goldGift + mercenarySalary);
                }

                // Clear hired mercenaries from active state
                window.gameState.state.mercenaries = [];
                window.gameState.save();

                log.push(`[SYSTEM] BRAMA OCZYSZCZONA Z SUKCESEM!`);
                if (this.isGuestMercenaryRaid) {
                    log.push(`Podsumowanie kontraktu: Otrzymano stałe wynagrodzenie${extraGoldText}.${crystalsBypassDistributionText}`);
                    log.push(gearText);
                } else {
                    log.push(`Otrzymane nagrody: +${crystalsEarned} Kryształów Mana${mercCutText}${extraGoldText}!`);
                    log.push(gearText);
                }

                // Update active quest progress
                const questReport = window.questSystem.checkActiveQuestProgress();
                if (questReport) {
                    log.push(`[ZADANIE UKOŃCZONE] ${questReport.title}! ${questReport.rewardText}`);
                }

                this.battleLog.push(...log);

                // Show Victory Summary Screen
                if (this.combatStats) {
                    this.combatStats.durationSeconds = Math.max(1, Math.floor((Date.now() - this.combatStats.startTime) / 1000));
                }
                const statsCopy = JSON.parse(JSON.stringify(this.combatStats));
                statsCopy.itemsObtained = [...this.combatStats.itemsObtained];
                setTimeout(() => {
                    if (window.uiEngine) {
                        window.uiEngine.showRaidSummary(true, statsCopy, gate);
                    }
                }, 500);
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

        // 3b. Emergency Escape / Death check for Player
        const playerInActiveParty = this.activeParty.find(a => a.id === 'player');
        if (playerInActiveParty) {
            const hpRatio = playerInActiveParty.hp / playerInActiveParty.maxHp;
            
            // Trigger escape prompt at < 10% health
            if (hpRatio <= 0.10 && playerInActiveParty.hp > 0 && !this.escapePromptTriggered) {
                this.escapePromptTriggered = true;
                this.isPaused = true;
                this.battleLog.push(...log);
                if (window.uiEngine) {
                    window.uiEngine.showEscapeModal();
                }
                return;
            }

            // Trigger Permanent Death overlay if player HP is 0
            if (playerInActiveParty.hp <= 0) {
                this.battleActive = false;
                this.isPaused = true;
                
                // Set current gate to null so the game registry knows we ended
                window.gameState.state.world.currentGate = null;
                window.gameState.state.player.hp = 0;
                window.gameState.state.mercenaries = [];
                window.gameState.save();

                log.push(`[KATASTROFA] TWÓJ BOHATER ODNIOSŁ ŚMIERTELNE OBRAŻENIA!`);
                this.battleLog.push(...log);
                if (window.uiEngine) {
                    window.uiEngine.showDeathScreen();
                }
                return;
            }
        }

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

            // Show Defeat Summary Screen
            if (this.combatStats) {
                this.combatStats.durationSeconds = Math.max(1, Math.floor((Date.now() - this.combatStats.startTime) / 1000));
            }
            const statsCopy = JSON.parse(JSON.stringify(this.combatStats));
            statsCopy.itemsObtained = []; // items aren't persistent on defeat
            setTimeout(() => {
                if (window.uiEngine) {
                    window.uiEngine.showRaidSummary(false, statsCopy, gate);
                }
            }, 600);
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

        if (this.isGuestMercenaryRaid) {
            expAwarded = Math.floor(expAwarded * 0.40); // 40% experience as guest mercenary
            expAwarded = Math.max(1, expAwarded);
        }

        // Track total EXP gained during combat
        if (this.combatStats) {
            this.combatStats.expGained += expAwarded;
        }

        // Apply exp to player
        const playerLvlUp = window.gameState.addPlayerExp(expAwarded);
        let lvlUpText = playerLvlUp ? " [BOHATER AWANSOWAŁ!]" : "";

        this.battleLog.push(`[SYSTEM - ZABITO WROGA] ${monster.name} został pokonany. Zdobywasz +${expAwarded} EXP.${lvlUpText}`);

        // Apply exp to companions (only if we are not in guest mercenary raid)
        if (!this.isGuestMercenaryRaid) {
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
        }

        // Regular monsters drops: 100% chance for crystal(s) matched to monster rank, 8% chance for gear loot
        if (!monster.isBoss) {
            let dropChanceMult = 1.0;
            if (this.gateType === 'red_gate') dropChanceMult = 1.5;
            if (this.gateType === 'double_dungeon') dropChanceMult = 1.8;

            // Crystals quantity based on rank
            let minCryst = 1;
            let maxCryst = 1;
            if (gate.rank === 'D') { minCryst = 1; maxCryst = 2; }
            else if (gate.rank === 'C') { minCryst = 2; maxCryst = 3; }
            else if (gate.rank === 'B') { minCryst = 3; maxCryst = 4; }
            else if (gate.rank === 'A') { minCryst = 4; maxCryst = 5; }
            else if (gate.rank === 'S') { minCryst = 5; maxCryst = 8; }

            let crystals = Math.floor(minCryst + Math.random() * (maxCryst - minCryst + 1));
            if (this.gateType === 'red_gate') crystals = Math.round(crystals * 1.5);

            const crystalTierNames = {
                'E': 'Zwykły Kryształ Many (E)',
                'D': 'Wzmocniony Kryształ Many (D)',
                'C': 'Czysty Kryształ Many (C)',
                'B': 'Skondensowany Kryształ Many (B)',
                'A': 'Doskonały Kryształ Many (A)',
                'S': 'Boski Kryształ Many (S)'
            };
            const cName = crystalTierNames[gate.rank] || 'Kryształ Many';

            // Add crystal resources with the gate's rank (only if we are not in a guest mercenary raid)
            if (!this.isGuestMercenaryRaid) {
                window.gameState.addManaCrystals(crystals, gate.rank);
                if (this.combatStats) {
                    this.combatStats.manaCrystalsEarned[gate.rank] = (this.combatStats.manaCrystalsEarned[gate.rank] || 0) + crystals;
                }
                this.battleLog.push(`[ŁUP - KRYSZTAŁY] ${monster.name} pozostawia +${crystals}x [${cName}]!`);
            } else {
                this.battleLog.push(`[DYSTRYBUCJA] Pokonany ${monster.name} upuszcza +${crystals}x [${cName}], które trafiają do worka Lidera.`);
            }

            if (!this.isGuestMercenaryRaid) {
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
                        if (this.combatStats) {
                            this.combatStats.itemsObtained.push(gear);
                        }
                        this.battleLog.push(`[ŁUP - PRZEDMIOT] Pokonany wróg upuszcza rzadki przedmiot: [${gear.rarity}] ${gear.name}!`);
                    }
                }
            } else {
                // Reduced guest loot chance (2%) for finding something on player's own
                if (Math.random() < 0.02) {
                    const hpPots = window.gameState.state.inventory.hpPotions !== undefined ? window.gameState.state.inventory.hpPotions : 0;
                    const mpPots = window.gameState.state.inventory.mpPotions !== undefined ? window.gameState.state.inventory.mpPotions : 0;
                    const slotsUsed = window.gameState.state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
                    
                    if (slotsUsed < 20) {
                        const gear = this.generateRNGGear(gate.rank, 0);
                        window.gameState.state.inventory.gear.push(gear);
                        if (this.combatStats) {
                            this.combatStats.itemsObtained.push(gear);
                        }
                        this.battleLog.push(`[ŁUP NAJEMNIKA] Przeszukując kąty pokoju, odnalazłeś rzadki porzucony przedmiot: [${gear.rarity}] ${gear.name}!`);
                    }
                }
            }
        }

        // Trigger UI updates
        window.uiEngine.updateHUD();
    }

    /**
     * Calculates victory prediction / death probability for a specific gate based on player and companion stats.
     */
    calculateDeathProbability(gateId) {
        const state = window.gameState.state;
        let gate = this.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        if (!gate) return 0;

        // 1. Calculate active party power
        let partyHp = 0;
        let partyAtk = 0;
        let partyDef = 0;

        const playerStats = window.classSystem.calculateDerivedStats(state.player);
        partyHp += playerStats.maxHp;
        partyAtk += playerStats.patk + playerStats.matk;
        partyDef += playerStats.def;

        if (state.party) {
            state.party.forEach(id => {
                if (id === 'player') return;
                const companion = state.companions[id];
                if (companion && companion.recruited) {
                    const derived = window.classSystem.calculateDerivedStats(companion);
                    partyHp += derived.maxHp;
                    partyAtk += derived.patk + derived.matk;
                    partyDef += derived.def;
                }
            });
        }

        if (state.mercenaries) {
            state.mercenaries.forEach(mercenary => {
                partyHp += mercenary.maxHp;
                partyAtk += mercenary.derived.patk + mercenary.derived.matk;
                partyDef += mercenary.derived.def;
            });
        }

        const partyPower = partyHp * 1.0 + (partyAtk * 4.5) + (partyDef * 3.5);

        // 2. Estimate enemies power (mobs + boss)
        let enemyHp = gate.mobTemplate.hp;
        let enemyAtk = gate.mobTemplate.patk;
        let enemyDef = gate.mobTemplate.def;

        // Determine average mobs based on rank
        let minMobs = 2;
        let maxMobs = 4;
        if (gate.rank === 'D') { minMobs = 3; maxMobs = 6; }
        else if (gate.rank === 'C') { minMobs = 5; maxMobs = 10; }
        else if (gate.rank === 'B') { minMobs = 7; maxMobs = 13; }
        else if (gate.rank === 'A') { minMobs = 10; maxMobs = 16; }
        else if (gate.rank === 'S') { minMobs = 12; maxMobs = 20; }
        
        const avgMobsCount = (minMobs + maxMobs) / 2;
        const sectorsCount = gate.waves || 3;

        // Cumulative stats of monsters and final boss
        let totalEnemyHp = (enemyHp * avgMobsCount * (sectorsCount - 1)) + gate.boss.hp;
        let totalEnemyAtk = (enemyAtk * avgMobsCount * (sectorsCount - 1)) + gate.boss.patk;
        let totalEnemyDef = (enemyDef * avgMobsCount * (sectorsCount - 1)) + gate.boss.def;

        let enemyPower = totalEnemyHp * 1.0 + (totalEnemyAtk * 4.0) + (totalEnemyDef * 3.0);

        // Multipliers based on gate style
        const gLabel = gate.name.toLowerCase();
        const isRedGate = gate.dynamicType === 'red_gate' || gLabel.includes("czerwon") || gLabel.includes("red");
        const isDoubleDungeon = gate.dynamicType === 'double_dungeon' || gLabel.includes("podwój") || gLabel.includes("double");
        const isDungeonBreak = gate.dynamicType === 'dungeon_break' || gLabel.includes("przełom") || gLabel.includes("break");

        if (isRedGate) enemyPower *= 1.40;
        if (isDoubleDungeon) enemyPower *= 1.50;
        if (isDungeonBreak) enemyPower *= 1.25;

        // Ratio analysis
        let ratio = enemyPower / Math.max(1, partyPower);
        let prob = Math.min(99, Math.max(1, Math.floor(ratio * 45)));

        return prob;
    }

    /**
     * Generates a fully procedural dynamic dungeon, including Red Gates and dungeon breaks.
     */
    generateDynamicGate(forceType = null) {
        const state = window.gameState.state;
        if (!state) return;

        // Determine rank dynamically based on player level
        const lvl = state.player.level;
        let rank = 'E';
        if (lvl >= 55) {
            const r = Math.random();
            rank = r < 0.1 ? 'C' : (r < 0.3 ? 'B' : (r < 0.75 ? 'A' : 'S'));
        } else if (lvl >= 35) {
            const r = Math.random();
            rank = r < 0.2 ? 'D' : (r < 0.45 ? 'C' : (r < 0.85 ? 'B' : 'A'));
        } else if (lvl >= 20) {
            const r = Math.random();
            rank = r < 0.25 ? 'E' : (r < 0.55 ? 'D' : (r < 0.9 ? 'C' : 'B'));
        } else if (lvl >= 8) {
            const r = Math.random();
            rank = r < 0.4 ? 'E' : (r < 0.85 ? 'D' : 'C');
        } else {
            rank = Math.random() < 0.8 ? 'E' : 'D';
        }

        // Randomly build a Solo-Leveling vibe name
        const prefixes = ["Nieokiełznana", "Skażona", "Pradawna", "Nawiedzona", "Przeklęta", "Glifowa", "Płonąca", "Kryształowa", "Mroźna", "Tajemnicza", "Północna", "Krwawa"];
        const locations = ["Szczelina", "Krypta", "Otchłań", "Grota", "Jaskinia", "Świątynia", "Zgorzelina", "Równina", "Katastrofa", "Rozpadlina"];
        const suffixes = ["Cienia", "Cierpienia", "Koszmaru", "Monarchy", "Pustki", "Goblinów", "Rycerzy", "Nieumarłych", "Demonów", "Magii"];
        
        const rName = `${prefixes[Math.floor(Math.random()*prefixes.length)]} ${locations[Math.floor(Math.random()*locations.length)]} ${suffixes[Math.floor(Math.random()*suffixes.length)]}`;

        // Determine type: 'standard', 'red_gate' (20% chance), 'dungeon_break' (15% chance)
        let type = 'standard';
        if (forceType) {
            type = forceType;
        } else {
            const rType = Math.random();
            if (rType < 0.22) {
                type = 'red_gate';
            } else if (rType < 0.38) {
                type = 'dungeon_break';
            }
        }

        // Pull core templates to scale stats
        let baseTemplate = this.gates['gate_e_01'];
        if (rank === 'D') baseTemplate = this.gates['gate_d_01'];
        else if (rank === 'C') baseTemplate = this.gates['gate_c_01'];
        else if (rank === 'B') baseTemplate = this.gates['gate_b_01'];
        else if (rank === 'A') baseTemplate = this.gates['gate_a_01'];
        else if (rank === 'S') baseTemplate = this.gates['gate_s_01'];

        const gateId = `dynamic_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const baseSectors = baseTemplate.waves;

        // Compile custom dynamic gate object
        const dynamicGate = {
            id: gateId,
            name: type === 'dungeon_break' ? `🚨 [PRZEŁOM] ${rName}` : (type === 'red_gate' ? `🔴 [CZERWONA] ${rName}` : rName),
            rank: rank,
            waves: baseSectors + (type === 'red_gate' || type === 'dungeon_break' ? 1 : 0),
            recommendedLvl: baseTemplate.recommendedLvl,
            mobTemplate: JSON.parse(JSON.stringify(baseTemplate.mobTemplate)),
            boss: JSON.parse(JSON.stringify(baseTemplate.boss)),
            rewards: JSON.parse(JSON.stringify(baseTemplate.rewards)),
            isDynamic: true,
            dynamicType: type
        };

        // Scale difficulty & rewards based on type
        if (type === 'red_gate') {
            dynamicGate.rewards.exp = Math.floor(dynamicGate.rewards.exp * 1.30);
            dynamicGate.rewards.crystalsMax = Math.floor(dynamicGate.rewards.crystalsMax * 1.50);
        } else if (type === 'dungeon_break') {
            dynamicGate.rewards.exp = Math.floor(dynamicGate.rewards.exp * 1.45);
            dynamicGate.rewards.crystalsMax = Math.floor(dynamicGate.rewards.crystalsMax * 1.80);
        }

        if (!state.world.dynamicGates) {
            state.world.dynamicGates = [];
        }
        state.world.dynamicGates.push(dynamicGate);
        window.gameState.save();

        // Inform the player about world occurrences
        let systemMsg = "";
        if (type === 'dungeon_break') {
            systemMsg = `[MELDUNEK TAKTYCZNY - ALARM PRZEŁOMU]\nWykryto groźny PRZEŁOM LOCHU (Ranga ${rank})! Potwory szturmują miasto! Łowco, pomóż w obronie.\n- Wejście jest darmowe i ufundowane przez Stowarzyszenie (Licencja: 0 Złota)\n- Po sukcesie otrzymasz sowitą nagrodę finansową!`;
        } else if (type === 'red_gate') {
            systemMsg = `[ANOMALIA PYLONU - CZERWONA BRAMA]\nOdkryto nieliniową CZERWONĄ BRAMĘ (Ranga ${rank})! Zabezpiecz wejście, nim portal zmieni koordynaty. Nagrody za ukończenie są znacznie lepsze.`;
        } else {
            systemMsg = `[ASYGNACJA SZCZELINY - NOWA BRAMA]\nWykryto tradycyjną otwartą szczelinę (Ranga ${rank}) w Sektorze Bram. Opłać licencję i zarezerwuj, by zdobyć unikalny loot.`;
        }

        if (window.uiEngine) {
            window.uiEngine.showSystemAlert(systemMsg);
            window.uiEngine.renderGatesTab();
            window.uiEngine.updateHUD();
        }
    }
}

window.dungeonsSystem = new DungeonsSystem();
