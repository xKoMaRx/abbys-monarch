/**
 * Abyss Monarch - Quest and Missions System
 * Handles the iconic Daily Quest (Sung Jin-Woo style) and Companion Recruitment Quests.
 */

class QuestSystem {
    constructor() {
        this.dailyQuestDesc = {
            pushups: 100,
            situps: 100,
            squats: 100,
            run: 10 // km
        };

        this.questsDb = {
            'tutorial': {
                id: 'tutorial',
                title: 'Wstęp do Otchłani',
                desc: 'Odwiedź Park Centralny za dnia i porozmawiaj z Shin Yu-Na, aby dowiedzieć się więcej o współczesnych łowcach.',
                type: 'talk_yu_na',
                reward: { gold: 100, exp: 100 }
            },
            'jin_soo_trial': {
                id: 'jin_soo_trial',
                title: 'Tarczownik w Potrzebie',
                desc: 'Oczyszczaj Bramy, aż zdobędziesz 5 Mana Kryształów, aby pomóc Jin-Soo naprawić jego pękniętą stalową tarczę.',
                type: 'collect_crystals',
                target: 5,
                reward: { gold: 500, trust_jin_soo: 15 }
            },
            'min_ah_study': {
                id: 'min_ah_study',
                title: 'Zgłębianie Teorii Magii',
                desc: 'Zwiększ statystykę Inteligencji (INT) głównego bohatera do co najmniej 20, studiując w Bibliotece.',
                type: 'stat_int',
                target: 20,
                reward: { gold: 300, trust_min_ah: 10, book: 'book_mana_shield' }
            }
        };
    }

    /**
     * Executes the daily quest training workout at home
     */
    doDailyQuest() {
        let world = window.gameState.state.world;
        let player = window.gameState.state.player;

        if (world.dailyQuestDone) {
            return {
                success: false,
                reason: 'Wykonałeś już dzisiejszy Daily Quest! Twoje mięśnie muszą odpocząć do jutra.'
            };
        }

        // Daily quest takes 4 hours of hard physical work
        window.citySystem.advanceTime(4);

        // Mark as completed
        world.dailyQuestDone = true;

        // Reward physical stats + EXP
        player.stats.str += 1;
        player.stats.dex += 1;
        player.stats.vit += 1;
        
        const expReward = 50 + player.level * 10;
        const leveledUp = window.gameState.addPlayerExp(expReward);

        window.gameState.save();

        return {
            success: true,
            text: `[DAILY QUEST: ZAKOŃCZONY]\n` +
                  `Wykonałeś: 100 pompek, 100 brzuszków, 100 przysiadów i przebiegłeś 10km!\n` +
                  `Zyskujesz: +1 SIŁY (STR), +1 ZRĘCZNOŚCI (DEX), +1 WITALNOŚCI (VIT) oraz +${expReward} EXP!`,
            leveledUp: leveledUp
        };
    }

    /**
     * Checks all active quests to see if their objectives are met
     */
    checkActiveQuestProgress() {
        let world = window.gameState.state.world;
        let player = window.gameState.state.player;
        let inventory = window.gameState.state.inventory;

        if (!world.activeQuest) return null;

        const quest = this.questsDb[world.activeQuest.id];
        if (!quest) return null;

        let completed = false;

        switch (quest.type) {
            case 'talk_yu_na':
                // Checked manually in dialogue UI when talking to Yu-Na
                break;
            case 'collect_crystals':
                world.activeQuest.progress = inventory.manaCrystals;
                if (inventory.manaCrystals >= quest.target) {
                    completed = true;
                    // Deduct crystals for the quest
                    inventory.manaCrystals -= quest.target;
                }
                break;
            case 'stat_int':
                world.activeQuest.progress = player.stats.int;
                if (player.stats.int >= quest.target) {
                    completed = true;
                }
                break;
        }

        if (completed) {
            return this.completeQuest();
        }

        window.gameState.save();
        return null;
    }

    /**
     * Manually triggers completion of the active talk quest
     */
    triggerTalkQuestCompletion(npcId) {
        let world = window.gameState.state.world;
        if (!world.activeQuest) return false;

        const quest = this.questsDb[world.activeQuest.id];
        if (quest && quest.type === 'talk_yu_na' && npcId === 'yu_na') {
            this.completeQuest();
            return true;
        }
        return false;
    }

    /**
     * Awards rewards for completing the active quest and picks the next quest
     */
    completeQuest() {
        let world = window.gameState.state.world;
        let companions = window.gameState.state.companions;
        let inventory = window.gameState.state.inventory;

        const quest = this.questsDb[world.activeQuest.id];
        if (!quest) return null;

        // Award rewards
        if (quest.reward.gold) {
            window.gameState.addGold(quest.reward.gold);
        }
        if (quest.reward.exp) {
            window.gameState.addPlayerExp(quest.reward.exp);
        }
        if (quest.reward.trust_jin_soo && companions.jin_soo) {
            companions.jin_soo.trust = Math.min(100, companions.jin_soo.trust + quest.reward.trust_jin_soo);
        }
        if (quest.reward.trust_min_ah && companions.min_ah) {
            companions.min_ah.trust = Math.min(100, companions.min_ah.trust + quest.reward.trust_min_ah);
        }
        if (quest.reward.book) {
            inventory.skillBooks.push(quest.reward.book);
        }

        console.log(`Quest "${quest.title}" completed!`);

        // Advance story/quests chain
        let nextQuest = null;
        if (quest.id === 'tutorial') {
            nextQuest = { id: 'jin_soo_trial', progress: 0 };
        } else if (quest.id === 'jin_soo_trial') {
            nextQuest = { id: 'min_ah_study', progress: 0 };
        } else {
            // End of main chain, generate repeating bounty quests
            nextQuest = null;
        }

        const completedQuestTitle = quest.title;
        world.activeQuest = nextQuest ? {
            id: nextQuest.id,
            title: this.questsDb[nextQuest.id].title,
            desc: this.questsDb[nextQuest.id].desc,
            progress: 0,
            target: this.questsDb[nextQuest.id].target || 1
        } : null;

        window.gameState.save();

        return {
            title: completedQuestTitle,
            rewardText: `Otrzymałeś: ` +
                `${quest.reward.gold ? `+${quest.reward.gold} Złota, ` : ''}` +
                `${quest.reward.exp ? `+${quest.reward.exp} EXP, ` : ''}` +
                `${quest.reward.trust_jin_soo ? `+${quest.reward.trust_jin_soo} Zaufania Jin-Soo, ` : ''}` +
                `${quest.reward.trust_min_ah ? `+${quest.reward.trust_min_ah} Zaufania Min-Ah, ` : ''}` +
                `${quest.reward.book ? `Zwój Czaru, ` : ''}`
        };
    }
}

window.questSystem = new QuestSystem();
