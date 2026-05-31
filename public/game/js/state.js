/**
 * Abyss Monarch - Game State Manager (Multi-Save Profile & Prestige Update)
 * Coordinates independent save profiles, prestige Breakthroughs, and offline rewards.
 */

class GameState {
    constructor() {
        this.LIST_KEY = 'abyss_monarch_profile_list';
        this.SAVE_KEY = null; // Dynamically bound upon logging in/selecting profile
        this.state = null;
    }

    /**
     * Retrieves the master list of all saved local profiles
     */
    loadProfileList() {
        const listData = localStorage.getItem(this.LIST_KEY);
        if (!listData) return [];
        try {
            return JSON.parse(listData);
        } catch (e) {
            console.error("Failed to parse profile list", e);
            return [];
        }
    }

    /**
     * Saves the master profile list back to localStorage
     */
    saveProfileList(list) {
        localStorage.setItem(this.LIST_KEY, JSON.stringify(list));
    }

    /**
     * Generates a clean default starting state for a new character.
     */
    getDefaultState(name, stats, avatar, talent) {
        return {
            player: {
                name: name || 'Jin-Woo',
                level: 1,
                exp: 0,
                expNeeded: 100,
                baseClass: 'Novice',
                currentClass: 'Novice',
                stats: stats ? { ...stats } : { str: 10, dex: 10, vit: 10, int: 10, wis: 10, luk: 10 },
                baseStats: stats ? { ...stats } : { str: 10, dex: 10, vit: 10, int: 10, wis: 10, luk: 10 }, // Remembered for prestige
                statPoints: 0,
                avatar: avatar || 'avatar_shadow',
                talent: talent || 'talent_focus', // passives: talent_focus, talent_blood, talent_well, talent_gold, talent_crit
                skills: [
                    { id: 'strike', level: 1, exp: 0, maxLevel: 10 }
                ],
                equippedSkills: ['strike'],
                equippedGear: {
                    head: null, chest: null, pants: null, boots: null,
                    shoulder_l: null, shoulder_r: null, glove_l: null, glove_r: null,
                    belt: null, cape: null,
                    ring_l1: null, ring_l2: null, ring_l3: null, ring_l4: null, ring_l5: null,
                    ring_r1: null, ring_r2: null, ring_r3: null, ring_r4: null, ring_r5: null,
                    weapon_l: null, weapon_r: null
                }
            },
            prestige: {
                count: 0,
                abyssShards: 0,
                upgrades: {
                    power: 0,
                    haste: 0,
                    gold: 0,
                    time: 0
                }
            },
            party: ['player'],
            companions: {
                min_ah: {
                    id: 'min_ah',
                    name: 'Lee Min-Ah',
                    rank: 'A',
                    baseClass: 'Mage',
                    currentClass: 'Mage',
                    level: 12,
                    exp: 0,
                    expNeeded: 1500,
                    stats: { str: 8, dex: 12, vit: 15, int: 28, wis: 24, luk: 10 },
                    skills: [{ id: 'fireball', level: 3, exp: 0, maxLevel: 10 }],
                    equippedSkills: ['fireball'],
                    equippedGear: {
                        head: null, chest: null, pants: null, boots: null,
                        shoulder_l: null, shoulder_r: null, glove_l: null, glove_r: null,
                        belt: null, cape: null,
                        ring_l1: null, ring_l2: null, ring_l3: null, ring_l4: null, ring_l5: null,
                        ring_r1: null, ring_r2: null, ring_r3: null, ring_r4: null, ring_r5: null,
                        weapon_l: null, weapon_r: null
                    },
                    trust: 10,
                    affection: 0,
                    recruited: false
                },
                jin_soo: {
                    id: 'jin_soo',
                    name: 'Park Jin-Soo',
                    rank: 'B',
                    baseClass: 'Warrior',
                    currentClass: 'Warrior',
                    level: 10,
                    exp: 0,
                    expNeeded: 1200,
                    stats: { str: 24, dex: 10, vit: 26, int: 8, wis: 10, luk: 12 },
                    skills: [{ id: 'provoke', level: 2, exp: 0, maxLevel: 10 }],
                    equippedSkills: ['provoke'],
                    equippedGear: {
                        head: null, chest: null, pants: null, boots: null,
                        shoulder_l: null, shoulder_r: null, glove_l: null, glove_r: null,
                        belt: null, cape: null,
                        ring_l1: null, ring_l2: null, ring_l3: null, ring_l4: null, ring_l5: null,
                        ring_r1: null, ring_r2: null, ring_r3: null, ring_r4: null, ring_r5: null,
                        weapon_l: null, weapon_r: null
                    },
                    trust: 15,
                    affection: 5,
                    recruited: false
                },
                yu_na: {
                    id: 'yu_na',
                    name: 'Shin Yu-Na',
                    rank: 'B',
                    baseClass: 'Cleric',
                    currentClass: 'Cleric',
                    level: 9,
                    exp: 0,
                    expNeeded: 1000,
                    stats: { str: 10, dex: 10, vit: 16, int: 18, wis: 22, luk: 14 },
                    skills: [{ id: 'heal', level: 2, exp: 0, maxLevel: 10 }],
                    equippedSkills: ['heal'],
                    equippedGear: {
                        head: null, chest: null, pants: null, boots: null,
                        shoulder_l: null, shoulder_r: null, glove_l: null, glove_r: null,
                        belt: null, cape: null,
                        ring_l1: null, ring_l2: null, ring_l3: null, ring_l4: null, ring_l5: null,
                        ring_r1: null, ring_r2: null, ring_r3: null, ring_r4: null, ring_r5: null,
                        weapon_l: null, weapon_r: null
                    },
                    trust: 5,
                    affection: 0,
                    recruited: false
                }
            },
            mercenaries: [],
            inventory: {
                gold: 500,
                manaCrystals: 0,
                gifts: {
                    lilac_flowers: 1,
                    energy_drink: 2,
                    macarons: 1,
                    silver_ring: 0
                },
                gear: [], 
                skillBooks: []
            },
            world: {
                currentTime: 8,
                dayCount: 1,
                unlockedGates: ['gate_e_01'],
                currentGate: null,
                completedGates: [],
                activeQuest: {
                    id: 'tutorial',
                    title: 'Wstęp do Otchłani',
                    desc: 'Odwiedź Park Centralny za dnia i porozmawiaj z Shin Yu-Na, aby dowiedzieć się więcej o współczesnych łowcach.',
                    type: 'talk_yu_na',
                    progress: 0,
                    target: 1
                }
            },
            lastSaved: Date.now()
        };
    }

    /**
     * Creates and registers a new profile slot in list
     */
    saveNewProfile(name, stats, avatar, talent) {
        const list = this.loadProfileList();
        const profileId = `profile_${Date.now()}`;
        const newSaveKey = `abyss_monarch_save_${profileId}`;

        // 1. Generate clean default state
        const newState = this.getDefaultState(name, stats, avatar, talent);
        
        // 2. Save state to localStorage
        localStorage.setItem(newSaveKey, JSON.stringify(newState));

        // 3. Register in list
        list.push({
            id: profileId,
            saveKey: newSaveKey,
            name: name,
            level: 1,
            avatar: avatar,
            talent: talent,
            dayCount: 1
        });
        this.saveProfileList(list);

        // 4. Bind as active profile
        this.SAVE_KEY = newSaveKey;
        this.state = newState;
        this.save();
    }

    /**
     * Helper to migrate older save profiles to the 22-slot equipment structure
     */
    migrateSaveState(state) {
        if (!state) return;
        const slots = ['head', 'chest', 'pants', 'boots', 'shoulder_l', 'shoulder_r', 'glove_l', 'glove_r', 'belt', 'cape', 'ring_l1', 'ring_l2', 'ring_l3', 'ring_l4', 'ring_l5', 'ring_r1', 'ring_r2', 'ring_r3', 'ring_r4', 'ring_r5', 'weapon_l', 'weapon_r'];
        
        const migrateChar = (char) => {
            if (!char) return;
            if (!char.equippedGear) {
                char.equippedGear = {};
                slots.forEach(s => char.equippedGear[s] = null);
                return;
            }
            if (char.equippedGear.weapon !== undefined || char.equippedGear.armor !== undefined || char.equippedGear.ring !== undefined) {
                const oldWpn = char.equippedGear.weapon;
                const oldArm = char.equippedGear.armor;
                const oldRng = char.equippedGear.ring;

                char.equippedGear = {};
                slots.forEach(s => char.equippedGear[s] = null);

                char.equippedGear.weapon_l = oldWpn || null;
                char.equippedGear.chest = oldArm || null;
                char.equippedGear.ring_l1 = oldRng || null;
            } else {
                // Ensure all slots exist
                slots.forEach(s => {
                    if (char.equippedGear[s] === undefined) {
                        char.equippedGear[s] = null;
                    }
                });
            }
        };

        if (state.player) migrateChar(state.player);
        if (state.companions) {
            for (let id in state.companions) {
                migrateChar(state.companions[id]);
            }
        }
    }

    /**
     * Loads a specific profile, binding it as active and simulating offline progress
     */
    loadProfile(profileId) {
        const list = this.loadProfileList();
        const found = list.find(p => p.id === profileId);
        if (!found) return false;

        this.SAVE_KEY = found.saveKey;
        const savedData = localStorage.getItem(this.SAVE_KEY);
        
        if (savedData) {
            try {
                this.state = JSON.parse(savedData);
                this.migrateSaveState(this.state);
                this.calculateOfflineProgress();
                return true;
            } catch (e) {
                console.error("Failed to load profile data", e);
                return false;
            }
        }
        return false;
    }

    /**
     * Permanently deletes a profile slot
     */
    deleteProfile(profileId) {
        const list = this.loadProfileList();
        const found = list.find(p => p.id === profileId);
        if (!found) return;

        // Remove actual save state
        localStorage.removeItem(found.saveKey);

        // Update list
        const updatedList = list.filter(p => p.id !== profileId);
        this.saveProfileList(updatedList);

        if (this.SAVE_KEY === found.saveKey) {
            this.SAVE_KEY = null;
            this.state = null;
        }
    }

    /**
     * Initializes state (Placeholder for compatibility, main loading delegated to App)
     */
    init() {
        // Handled dynamically by selecting profile now
    }

    /**
     * Writes the current active state to localStorage and updates master list summary
     */
    save() {
        if (!this.SAVE_KEY || !this.state) return;
        
        this.state.lastSaved = Date.now();
        localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));

        // Sync back summary in master list
        const list = this.loadProfileList();
        const mySlotId = this.SAVE_KEY.replace('abyss_monarch_save_', '');
        const profile = list.find(p => p.id === mySlotId);
        
        if (profile) {
            profile.level = this.state.player.level;
            profile.dayCount = this.state.world.dayCount;
            this.saveProfileList(list);
        }
    }

    /**
     * Processes progress accumulated while the game was closed.
     */
    calculateOfflineProgress() {
        if (!this.state) return;
        const now = Date.now();
        const secondsOffline = Math.floor((now - this.state.lastSaved) / 1000);
        if (secondsOffline < 10) return; 

        const activeSeconds = Math.min(secondsOffline, 43200);
        console.log(`Offline calculation: ${activeSeconds} seconds.`);

        if (this.state.world.currentGate) {
            // Base farming rate when closed: 1 crystal per 100 seconds
            const baseCrystals = Math.floor(activeSeconds * 0.01);
            const baseExp = Math.floor(activeSeconds * 0.05);

            // Apply gold multipliers from prestige (also increases crystal yield!)
            const goldUpgradeLvl = this.state.prestige.upgrades.gold || 0;
            const goldMult = 1.0 + (goldUpgradeLvl * 0.20) + (this.state.player.talent === 'talent_gold' ? 0.20 : 0.0);
            
            const crystalsEarned = Math.max(1, Math.floor(baseCrystals * goldMult));
            this.addManaCrystals(crystalsEarned);
            this.addPlayerExp(baseExp);
            
            console.log(`Offline earnings: Crystals +${crystalsEarned}, EXP +${baseExp}`);
        }
    }

    /**
     * Execution of Prestige breakthrough
     */
    executePrestige() {
        if (!this.state || this.state.player.level < 30) return { success: false, reason: 'Wymagany poziom 30, aby przeprowadzić Przełom!' };

        // 1. Calculate shards earned: Lvl 30 = 2 shards, each additional level gives +2 shards
        const shardsEarned = Math.max(0, (this.state.player.level - 29) * 2);

        // 2. Add shards and increment prestige count
        this.state.prestige.abyssShards += shardsEarned;
        this.state.prestige.count++;

        // 3. Reset player stats back to base distributed starting stats
        const base = this.state.player.baseStats;
        this.state.player.stats = { ...base };
        
        // Reset player level, exp, class
        this.state.player.level = 1;
        this.state.player.exp = 0;
        this.state.player.expNeeded = 100;
        this.state.player.statPoints = 0;
        this.state.player.currentClass = 'Novice';

        // Reset gold, crystals and empty unused loot bag
        this.state.inventory.gold = 500;
        this.state.inventory.manaCrystals = 0;
        this.state.inventory.gear = [];

        // Reset companion levels back to baseline (level 10) to preserve prestige feel
        for (let key in this.state.companions) {
            const comp = this.state.companions[key];
            comp.level = key === 'min_ah' ? 12 : (key === 'jin_soo' ? 10 : 9);
            comp.exp = 0;
            comp.expNeeded = key === 'min_ah' ? 1500 : (key === 'jin_soo' ? 1200 : 1000);
        }

        // Cancel active gate run and reset unlocking
        this.state.world.currentGate = null;
        this.state.world.unlockedGates = ['gate_e_01'];

        this.save();

        return {
            success: true,
            shards: shardsEarned
        };
    }

    /**
     * Buys a permanent upgrade from the Prestige shop
     */
    buyPrestigeUpgrade(upgradeId) {
        if (!this.state) return false;
        
        const cost = (this.state.prestige.upgrades[upgradeId] || 0) + 1; // 1 shard per upgrade level scaling
        if (this.state.prestige.abyssShards >= cost) {
            this.state.prestige.abyssShards -= cost;
            this.state.prestige.upgrades[upgradeId]++;
            this.save();
            return true;
        }
        return false;
    }

    /**
     * Mutators
     */
    addGold(amount) {
        if (!this.state) return;
        this.state.inventory.gold += amount;
        this.save();
    }

    spendGold(amount) {
        if (!this.state) return false;
        if (this.state.inventory.gold >= amount) {
            this.state.inventory.gold -= amount;
            this.save();
            return true;
        }
        return false;
    }

    addManaCrystals(amount) {
        if (!this.state) return;
        this.state.inventory.manaCrystals += amount;
        this.save();
    }

    spendManaCrystals(amount) {
        if (!this.state) return false;
        if (this.state.inventory.manaCrystals >= amount) {
            this.state.inventory.manaCrystals -= amount;
            this.save();
            return true;
        }
        return false;
    }

    addPlayerExp(amount) {
        if (!this.state) return false;
        let player = this.state.player;
        player.exp += amount;
        
        let leveledUp = false;
        while (player.exp >= player.expNeeded) {
            player.exp -= player.expNeeded;
            player.level++;
            player.statPoints += 5;
            player.expNeeded = Math.floor(player.expNeeded * 1.5);
            leveledUp = true;
        }
        
        if (leveledUp) {
            console.log(`Player leveled up to ${player.level}!`);
        }
        this.save();
        return leveledUp;
    }
}

// Export global instance
window.gameState = new GameState();
