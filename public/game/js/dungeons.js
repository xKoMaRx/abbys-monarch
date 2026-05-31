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
                mobTemplate: { name: 'Młody Zombie', hp: 80, patk: 6, def: 2 },
                boss: { name: 'Olbrzymi Zombie Golem', hp: 250, patk: 14, def: 5 },
                rewards: { goldMin: 30, goldMax: 60, crystalsMin: 1, crystalsMax: 3, exp: 40 }
            },
            'gate_d_01': {
                id: 'gate_d_01',
                name: 'Loch Gobliniego Wodza',
                rank: 'D',
                waves: 3,
                recommendedLvl: 8,
                mobTemplate: { name: 'Goblin Wojownik', hp: 200, patk: 16, def: 8 },
                boss: { name: 'Goblini Wódz', hp: 700, patk: 36, def: 18 },
                rewards: { goldMin: 150, goldMax: 250, crystalsMin: 5, crystalsMax: 10, exp: 150 }
            },
            'gate_c_01': {
                id: 'gate_c_01',
                name: 'Katakumby Nieumarłych Rycerzy',
                rank: 'C',
                waves: 4,
                recommendedLvl: 20,
                mobTemplate: { name: 'Szkielet Wojownik', hp: 500, patk: 40, def: 25 },
                boss: { name: 'Upadły Lich', hp: 2000, patk: 90, def: 50 },
                rewards: { goldMin: 500, goldMax: 800, crystalsMin: 12, crystalsMax: 20, exp: 500 }
            },
            'gate_b_01': {
                id: 'gate_b_01',
                name: 'Wyżyny Żelaznych Golemów',
                rank: 'B',
                waves: 4,
                recommendedLvl: 35,
                mobTemplate: { name: 'Runiczny Golem', hp: 1200, patk: 100, def: 80 },
                boss: { name: 'Rdzawy Golem Stalowy', hp: 5000, patk: 240, def: 150 },
                rewards: { goldMin: 1200, goldMax: 2000, crystalsMin: 30, crystalsMax: 50, exp: 1200 }
            },
            'gate_a_01': {
                id: 'gate_a_01',
                name: 'Legowisko Czerwonego Smoka',
                rank: 'A',
                waves: 4,
                recommendedLvl: 55,
                mobTemplate: { name: 'Smoczy Jaszczuroczłek', hp: 3000, patk: 220, def: 150 },
                boss: { name: 'Czerwony Smok Drake', hp: 12000, patk: 480, def: 300 },
                rewards: { goldMin: 3500, goldMax: 6000, crystalsMin: 80, crystalsMax: 150, exp: 4000 }
            },
            'gate_s_01': {
                id: 'gate_s_01',
                name: 'Brama Cienia Monarchów',
                rank: 'S',
                waves: 5,
                recommendedLvl: 75,
                mobTemplate: { name: 'Żołnierz Pustki', hp: 8000, patk: 500, def: 400 },
                boss: { name: 'Generał Pustki Bellion', hp: 35000, patk: 1100, def: 800 },
                rewards: { goldMin: 12000, goldMax: 20000, crystalsMin: 250, crystalsMax: 400, exp: 15000 }
            }
        };

        // Battle state trackers
        this.battleActive = false;
        this.activeParty = [];
        this.monsters = [];
        this.currentWave = 1;
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
        this.battleLog = [`[SYSTEM] Rozpoczęto rajd w Bramie: ${gate.name} (Ranga ${gate.rank})`];
        
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

        if (this.currentWave < gate.waves) {
            const numMobs = 2 + Math.floor(Math.random() * 2);
            for (let i = 1; i <= numMobs; i++) {
                const mobTemplate = gate.mobTemplate;
                const hp = Math.floor(mobTemplate.hp * (0.9 + Math.random() * 0.2));
                this.monsters.push({
                    name: `${mobTemplate.name} ${String.fromCharCode(64 + i)}`,
                    hp: hp,
                    maxHp: hp,
                    patk: mobTemplate.patk,
                    def: mobTemplate.def,
                    cooldown: 0,
                    actionGauge: Math.floor(Math.random() * 30)
                });
            }
            this.battleLog.push(`[SYSTEM] Fala ${this.currentWave}/${gate.waves}: Napotkano wrogie potwory!`);
        } else {
            const bossTemplate = gate.boss;
            this.monsters.push({
                name: bossTemplate.name,
                hp: bossTemplate.hp,
                maxHp: bossTemplate.hp,
                patk: bossTemplate.patk,
                def: bossTemplate.def,
                cooldown: 0,
                isBoss: true,
                actionGauge: Math.floor(Math.random() * 30)
            });
            this.battleLog.push(`[SYSTEM] FALA OSTATECZNA: Przed drużyną wyłania się boss - ${bossTemplate.name}!`);
        }
    }

    /**
     * Generates a procedural gear with random prefix, type, rarity, and stats
     */
    generateRNGGear(rank) {
        const rarities = ['Szary', 'Zielony', 'Niebieski', 'Fioletowy', 'Pomarańczowy'];
        const rolls = Math.random() * 100;
        
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
        if (monster.isBoss) {
            if (monster.name.includes("Smok")) return 18;
            if (monster.name.includes("Bellion")) return 22;
            if (monster.name.includes("Golem")) return 11;
            return 16;
        }
        if (monster.name.includes("Goblin")) return 15;
        if (monster.name.includes("Zombie")) return 9;
        if (monster.name.includes("Szkielet")) return 12;
        if (monster.name.includes("Golem")) return 8;
        if (monster.name.includes("Jaszczuroczłek")) return 14;
        if (monster.name.includes("Żołnierz")) return 16;
        return 12;
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
            // 18 base speed + DEX-based acceleration, scaled by Haste / cooldown reduction
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

        // Check if all monsters in this wave died
        const allMonstersDead = this.monsters.every(m => m.hp <= 0);
        if (allMonstersDead) {
            this.currentWave++;
            if (this.currentWave <= gate.waves) {
                this.spawnWave(gateId);
            } else {
                // Battle Win!
                this.battleActive = false;
                window.gameState.state.world.currentGate = null;
                
                // Crystals Calculation (Prestige & Talent multipliers apply to crystal yield!)
                let crystalsEarned = Math.floor(gate.rewards.crystalsMin + Math.random() * (gate.rewards.crystalsMax - gate.rewards.crystalsMin));

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

                // Victory Boss loot: 100% guaranteed gear drop on victory!
                const gearDropped = this.generateRNGGear(gate.rank);
                window.gameState.state.inventory.gear.push(gearDropped);

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

                // Apply resources (No gold from monsters!)
                window.gameState.addManaCrystals(crystalsEarned);

                // Clear hired mercenaries from active state
                window.gameState.state.mercenaries = [];
                window.gameState.save();

                log.push(`[SYSTEM] BRAMA OCZYSZCZONA Z SUKCESEM!`);
                log.push(`Otrzymane nagrody: +${crystalsEarned} Kryształów Mana${mercCutText}!`);
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
                const finalDmg = Math.max(1, Math.floor(monster.patk - target.derived.def * 0.3));
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
        
        if (monster.isBoss) {
            expAwarded = Math.floor(gate.rewards.exp * 0.5);
        } else {
            const denom = Math.max(1, (gate.waves - 1) * 2.5);
            expAwarded = Math.floor((gate.rewards.exp * 0.5) / denom);
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
            if (Math.random() < 0.30) {
                const crystals = Math.floor(1 + Math.random() * 2);
                window.gameState.addManaCrystals(crystals);
                this.battleLog.push(`[ŁUP - KRYSZTAŁY] Pokonany wróg upuszcza +${crystals} magicznych kryształów mana!`);
            }
            if (Math.random() < 0.08) {
                const hpPots = window.gameState.state.inventory.hpPotions !== undefined ? window.gameState.state.inventory.hpPotions : 0;
                const mpPots = window.gameState.state.inventory.mpPotions !== undefined ? window.gameState.state.inventory.mpPotions : 0;
                const slotsUsed = window.gameState.state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
                
                if (slotsUsed < 20) {
                    const gear = this.generateRNGGear(gate.rank);
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
