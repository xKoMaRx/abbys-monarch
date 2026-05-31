/**
 * Abyss Monarch - Core Game Orchestrator & Loop (Start Screen & Time Warp Update)
 * Coordinates profile loadings, auto-save cycles, and prestige time warp multipliers.
 */

class App {
    constructor() {
        this.gameLoopInterval = null;
        this.autoSaveInterval = null;
        this.ticksCount = 0;
    }

    /**
     * Bootstraps the application on page load
     */
    init() {
        console.log("System initializing Abyss Monarch with Multi-Profile support...");

        // 1. Initialize UI Engine (which loads profile selection screen)
        window.uiEngine.init();

        // 2. Start Game Loop (1 tick = 1 second)
        this.startGameLoop();

        // 3. Start Auto-Save Loop (every 30 seconds)
        this.startAutoSaveLoop();

        console.log("Abyss Monarch boot complete!");
    }

    /**
     * Main timer loop for battles and passive actions
     */
    startGameLoop() {
        if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);

        this.gameLoopInterval = setInterval(() => {
            // Only tick if logged in / profile is actively loaded
            if (!window.gameState.state) return;

            this.ticksCount++;
            const state = window.gameState.state;

            // Passive health and mana regeneration based on stats (VIT and WIS)
            const playerStats = window.classSystem.calculateDerivedStats(state.player);
            if (state.player.hp === undefined) state.player.hp = playerStats.maxHp;
            if (state.player.mp === undefined) state.player.mp = playerStats.maxMp;

            const hpRegen = Math.max(1, Math.floor(state.player.stats.vit * 0.08));
            const mpRegen = Math.max(1, Math.floor(state.player.stats.wis * 0.08));

            if (window.dungeonsSystem && window.dungeonsSystem.battleActive) {
                // Apply regen to active battle combatants
                window.dungeonsSystem.activeParty.forEach(ally => {
                    if (ally.id === 'player') {
                        ally.hp = Math.min(playerStats.maxHp, ally.hp + hpRegen);
                        ally.mp = Math.min(playerStats.maxMp, ally.mp + mpRegen);
                    } else if (!ally.isMercenary) {
                        const companion = state.companions[ally.id];
                        if (companion) {
                            const compStats = window.classSystem.calculateDerivedStats(companion);
                            const compHpRegen = Math.max(1, Math.floor(companion.stats.vit * 0.08));
                            const compMpRegen = Math.max(1, Math.floor(companion.stats.wis * 0.08));
                            
                            ally.hp = Math.min(compStats.maxHp, ally.hp + compHpRegen);
                            ally.mp = Math.min(compStats.maxMp, ally.mp + compMpRegen);
                        }
                    }
                });
            } else {
                // Apply regen directly to state when in town
                state.player.hp = Math.min(playerStats.maxHp, state.player.hp + hpRegen);
                state.player.mp = Math.min(playerStats.maxMp, state.player.mp + mpRegen);

                state.party.forEach(id => {
                    if (id === 'player') return;
                    const companion = state.companions[id];
                    if (companion && companion.recruited) {
                        const compStats = window.classSystem.calculateDerivedStats(companion);
                        if (companion.hp === undefined) companion.hp = compStats.maxHp;
                        if (companion.mp === undefined) companion.mp = compStats.maxMp;

                        const compHpRegen = Math.max(1, Math.floor(companion.stats.vit * 0.08));
                        companion.hp = Math.min(compStats.maxHp, companion.hp + compHpRegen);
                        
                        const compMpRegen = Math.max(1, Math.floor(companion.stats.wis * 0.08));
                        companion.mp = Math.min(compStats.maxMp, companion.mp + compMpRegen);
                    }
                });
            }

            // If a Gate raid is currently active, tick the battle simulator
            if (state.world.currentGate && window.dungeonsSystem.battleActive) {
                window.dungeonsSystem.simulateTick(state.world.currentGate);
                
                const activeTabVisible = !document.getElementById('view-combat').classList.contains('hidden');
                if (activeTabVisible) {
                    window.uiEngine.renderGatesTab();
                }
            }

            // Always update HUD to animate HP/MP regeneration and EXP updates
            window.uiEngine.updateHUD();



            // Passive city time warp calculation:
            // Base time is 60 ticks per city hour.
            // Permanent prestige upgrade 'time' reduces this requirement by 6 seconds (ticks) per level (up to 50% faster day/night cycle!).
            const timeUpgradeLvl = state.prestige.upgrades.time || 0;
            const ticksNeededPerHour = Math.max(20, 60 - (timeUpgradeLvl * 6));

            if (this.ticksCount >= ticksNeededPerHour) {
                this.ticksCount = 0;
                window.citySystem.advanceTime(1);
                
                // Refresh the location action view if the player is currently inside a city location
                const isExplorationActive = !document.getElementById('location-exploration').classList.contains('hidden');
                if (isExplorationActive && window.uiEngine.currentLocationId) {
                    window.uiEngine.enterCityLocation(window.uiEngine.currentLocationId);
                }
                window.uiEngine.updateHUD();
            }

        }, 1000);
    }

    /**
     * Automated state saving to avoid progress loss
     */
    startAutoSaveLoop() {
        if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);

        this.autoSaveInterval = setInterval(() => {
            if (!window.gameState.state) return;
            
            console.log("System auto-saving game progress...");
            window.gameState.save();
            window.uiEngine.updateHUD();
        }, 30000); // 30 seconds
    }
}

// Bind load event
window.addEventListener('load', () => {
    window.appEngine = new App();
    window.appEngine.init();
});
