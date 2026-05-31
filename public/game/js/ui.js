/**
 * Abyss Monarch - UI Rendering and DOM Manipulation Engine (Start Screen & Loot Update)
 * Coordinates tabs, visual novel interactions, character sheets, skill fusions, and real-time battle graphics.
 */

class UIEngine {
    constructor() {
        this.selectedCompanionId = 'player'; // default selected character in party view
        
        // Character creation temporary values
        this.tempStats = { str: 10, dex: 10, vit: 10, int: 10, wis: 10, luk: 10 };
        this.availablePoints = 10;
        this.activeAvatar = 'avatar_shadow';
        this.activeTalent = 'talent_focus';

        // Skill Fusion temporary selection slots
        this.fusionSlotA = null;
        this.fusionSlotB = null;

        // Selected gear item in inventory
        this.selectedGearId = null;

        this.currentLocationId = null;

        // Shadow bestiary pagination properties
        this.bestiaryPage = 1;
        this.bestiaryItemsPerPage = 20;
        this.bestiarySearchQuery = "";
        this.bestiaryRankQuery = "ALL";
    }

    /**
     * Bootstraps interface bindings and shows start screen profile selection
     */
    init() {
        const lastActive = localStorage.getItem('abyss_monarch_last_active_profile');
        if (lastActive) {
            const list = window.gameState.loadProfileList();
            const found = list.find(p => p.id === lastActive);
            if (found) {
                this.executeLogin(lastActive, true);
                return;
            }
        }
        this.renderStartScreen();
    }

    /**
     * Renders local profile logins or option to register a new hunter
     */
    renderStartScreen() {
        const list = window.gameState.loadProfileList();
        const container = document.getElementById('profiles-list-container');
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 15px 0;">Brak utworzonych łowców w systemie lokalnym.</p>`;
            return;
        }

        list.forEach(p => {
            let avatarClass = 'fa-user-secret';
            if (p.avatar === 'avatar_flame') avatarClass = 'fa-fire';
            else if (p.avatar === 'avatar_shield') avatarClass = 'fa-shield-cat';
            else if (p.avatar === 'avatar_hunter') avatarClass = 'fa-crosshairs';

            let talentName = 'Skupienie Gracza';
            if (p.talent === 'talent_blood') talentName = 'Krew Tytana';
            else if (p.talent === 'talent_well') talentName = 'Studnia Many';
            else if (p.talent === 'talent_gold') talentName = 'Złoty Dotyk';
            else if (p.talent === 'talent_crit') talentName = 'Zabójcza Precyzja';

            container.innerHTML += `
                <div class="profile-card">
                    <div class="profile-info">
                        <div class="avatar-icon"><i class="fa-solid ${avatarClass}"></i></div>
                        <div class="details">
                            <span class="name glowing-text">${p.name}</span>
                            <span class="lvl-day">Lvl ${p.level} | Dzień ${p.dayCount} | Talent: ${talentName}</span>
                        </div>
                    </div>
                    <div class="actions">
                        <button class="neon-btn cyan-btn" style="padding: 5px 10px; font-size: 9px;" onclick="window.uiEngine.executeLogin('${p.id}')">ZALOGUJ</button>
                        <button class="neon-btn violet-btn" style="padding: 5px 8px; font-size: 9px; border-color: #f44336; color: #f44336; background: rgba(244,67,54,0.1);" onclick="window.uiEngine.executeDeleteProfile('${p.id}', event)"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    }

    /**
     * Start Screen Login & Logout Actions
     */
    executeLogin(profileId, isAutoLogin = false) {
        const success = window.gameState.loadProfile(profileId);
        if (success) {
            // Initialize player hp/mp if not present
            const playerStats = window.classSystem.calculateDerivedStats(window.gameState.state.player);
            if (window.gameState.state.player.hp === undefined) window.gameState.state.player.hp = playerStats.maxHp;
            if (window.gameState.state.player.mp === undefined) window.gameState.state.player.mp = playerStats.maxMp;

            // Initialize companion hp/mp if not present
            for (let id in window.gameState.state.companions) {
                const companion = window.gameState.state.companions[id];
                const compStats = window.classSystem.calculateDerivedStats(companion);
                if (companion.hp === undefined) companion.hp = compStats.maxHp;
                if (companion.mp === undefined) companion.mp = compStats.maxMp;
            }

            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            // Set dynamic HUD icon based on avatar chosen
            const avatar = window.gameState.state.player.avatar;
            let avatarHtml = '<i class="fa-solid fa-user-secret"></i>';
            if (avatar === 'avatar_flame') avatarHtml = '<i class="fa-solid fa-fire"></i>';
            else if (avatar === 'avatar_shield') avatarHtml = '<i class="fa-solid fa-shield-cat"></i>';
            else if (avatar === 'avatar_hunter') avatarHtml = '<i class="fa-solid fa-crosshairs"></i>';
            document.getElementById('hud-avatar-icon').innerHTML = avatarHtml;

            this.updateHUD();
            this.renderPartyTab();
            this.renderSkillsTab();
            this.renderGatesTab();
            this.switchTab('city');
            
            const name = window.gameState.state.player.name;
            if (!isAutoLogin) {
                this.showSystemAlert(`[ZALOGOWANO POMYŚLNIE]\nWitaj z powrotem, Łowco ${name}.\nSystem przywrócił Twój stan bojowy. Gotowy do ponownego oczyszczania Bram Otchłani?`);
            }
        } else {
            alert('Wczytywanie profilu zakończone niepowodzeniem.');
        }
    }

    executeLogout() {
        // Save first
        window.gameState.save();

        // Remove active profile tracker
        localStorage.removeItem('abyss_monarch_last_active_profile');

        // Nullify slot
        window.gameState.SAVE_KEY = null;
        window.gameState.state = null;

        // Toggles views
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
        this.renderStartScreen();
    }

    executeDeleteProfile(profileId, event) {
        event.stopPropagation();
        if (confirm('Czy na pewno chcesz bezpowrotnie usunąć ten profil i wyczyścić całą historię tego Łowcy?')) {
            window.gameState.deleteProfile(profileId);
            this.renderStartScreen();
        }
    }

    openCharacterCreator() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('character-creator').classList.remove('hidden');
    }

    closeCharacterCreator() {
        document.getElementById('character-creator').classList.add('hidden');
        document.getElementById('start-screen').classList.remove('hidden');
    }

    /**
     * Character Creator 2.0 selection highlights
     */
    selectAvatar(avatarId) {
        this.activeAvatar = avatarId;
        
        // Convert underscore to dash for DOM lookup
        const domId = `sel-${avatarId.replace('_', '-')}`;
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
        const target = document.getElementById(domId);
        if (target) target.classList.add('active');
    }

    selectTalent(talentId) {
        this.activeTalent = talentId;
        
        const domId = `sel-${talentId.replace('_', '-')}`;
        document.querySelectorAll('.talent-option').forEach(opt => opt.classList.remove('active'));
        const target = document.getElementById(domId);
        if (target) target.classList.add('active');
    }

    /**
     * Updates top HUD resource stats, EXP bars, and active quest targets
     */
    updateHUD() {
        const state = window.gameState.state;
        if (!state) return;
        const player = state.player;
        const world = state.world;

        document.getElementById('hud-player-name').innerText = player.name;
        document.getElementById('hud-player-class').innerText = player.currentClass;
        
        const derived = window.classSystem.calculateDerivedStats(player);
        
        // HP bar update
        let hpVal = player.hp !== undefined ? player.hp : derived.maxHp;
        if (window.dungeonsSystem && window.dungeonsSystem.battleActive) {
            const playerAlly = window.dungeonsSystem.activeParty.find(a => a.id === 'player');
            if (playerAlly) {
                hpVal = playerAlly.hp;
            }
        }
        document.getElementById('hud-hp-text').innerText = `HP: ${hpVal}/${derived.maxHp}`;
        document.getElementById('hud-hp-fill').style.width = `${Math.max(0, Math.min(100, (hpVal / derived.maxHp) * 100))}%`;

        // MP bar update
        let mpVal = player.mp !== undefined ? player.mp : derived.maxMp;
        if (window.dungeonsSystem && window.dungeonsSystem.battleActive) {
            const playerAlly = window.dungeonsSystem.activeParty.find(a => a.id === 'player');
            if (playerAlly) {
                mpVal = playerAlly.mp;
            }
        }
        document.getElementById('hud-mp-text').innerText = `MP: ${mpVal}/${derived.maxMp}`;
        document.getElementById('hud-mp-fill').style.width = `${Math.max(0, Math.min(100, (mpVal / derived.maxMp) * 100))}%`;

        // EXP bar update
        document.getElementById('hud-exp-text').innerText = `EXP: ${player.exp}/${player.expNeeded}`;
        document.getElementById('hud-exp-fill').style.width = `${(player.exp / player.expNeeded) * 100}%`;

        // Fatigue bar update
        const fatigueVal = player.fatigue !== undefined ? player.fatigue : 0;
        const fatigueText = document.getElementById('hud-fatigue-text');
        if (fatigueText) fatigueText.innerText = `FAT: ${Math.round(fatigueVal)}/100`;
        const fatigueFill = document.getElementById('hud-fatigue-fill');
        if (fatigueFill) fatigueFill.style.width = `${fatigueVal}%`;
        
        // Show indicator on the fatigue fill based on severity
        if (fatigueFill) {
            if (fatigueVal > 75) {
                fatigueFill.style.background = 'linear-gradient(90deg, #f44336, #b71c1c)'; // Deep Red
            } else if (fatigueVal > 40) {
                fatigueFill.style.background = 'linear-gradient(90deg, #ff9800, #ff5722)'; // Orange
            } else {
                fatigueFill.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)'; // Green
            }
        }

        // Set dynamic hover tooltips for the bars
        const hpRegen = Math.max(1, Math.floor(player.stats.vit * 0.08));
        const mpRegen = Math.max(1, Math.floor(player.stats.wis * 0.08));
        
        const hpBar = document.querySelector('.hp-bar-container');
        if (hpBar) {
            hpBar.setAttribute('data-tooltip', `Punkty Zdrowia (HP): ${hpVal}/${derived.maxHp}\nPasywna regeneracja: +${hpRegen} HP/s\n(skaluje się z Witalnością: VIT * 0.08)`);
        }
        const mpBar = document.querySelector('.mp-bar-container');
        if (mpBar) {
            mpBar.setAttribute('data-tooltip', `Punkty Many (MP): ${mpVal}/${derived.maxMp}\nPasywna regeneracja: +${mpRegen} MP/s\n(skaluje się z Mądrością: WIS * 0.08)`);
        }
        const expBar = document.querySelector('.exp-bar-container');
        if (expBar) {
            expBar.setAttribute('data-tooltip', `Punkty Doświadczenia (EXP): ${player.exp}/${player.expNeeded}\nRozbijaj lochy Bram i wykonuj treningi, by awansować i zyskać 5 punktów statystyk.`);
        }
        const fatigueBar = document.querySelector('.fatigue-bar-container');
        if (fatigueBar) {
            const fatiguePenaltyText = fatigueVal > 0 ? `\n\nAKTYWNE KARY:\n- Szybkość ładowania akcji: -${Math.round((1 - Math.max(0.3, 1 - fatigueVal * 0.007)) * 100)}%\n- Uniki i Zwinność: -${Math.round((1 - Math.max(0.3, 1 - fatigueVal * 0.007)) * 100)}%\n- Atak i Obrona: -${Math.round((1 - Math.max(0.75, 1 - fatigueVal * 0.0025)) * 100)}%` : '\n\nBrak aktywnych kar (W pełni wypoczęty!)';
            fatigueBar.setAttribute('data-tooltip', `Zmęczenie (Fatigue): ${Math.round(fatigueVal)}/100\nRośnie o +12 na każdy sektor w Bramach.\nRegeneruje się automatycznie poza walką (0.25 pkt/s) oraz do 0 przy śnie w Domu.${fatiguePenaltyText}`);
        }

        const walletPill = document.getElementById('hud-wallet-pill');
        if (walletPill) {
            const tiersText = Object.entries(state.inventory.crystalTiers)
                .map(([rank, count]) => `${rank}: ${count}`)
                .join('\n');
            walletPill.setAttribute('data-tooltip', `Skarbiec i Waluty łowcy\nZłoto (G): ${state.inventory.gold}\nStan kryształów:\n${tiersText}\n\n1 kryształ = 10 G`);
        }
        
        document.getElementById('hud-gold').innerText = state.inventory.gold;
        
        // Sum crystals from tiers
        const totalCrystals = Object.values(state.inventory.crystalTiers).reduce((sum, count) => sum + count, 0);
        document.getElementById('hud-crystals').innerText = totalCrystals;
        
        document.getElementById('hud-day').innerText = world.dayCount;
        
        const hrs = String(world.currentTime).padStart(2, '0');
        document.getElementById('hud-time').innerText = `${hrs}:00`;

        const hpPots = state.inventory.hpPotions !== undefined ? state.inventory.hpPotions : 0;
        const mpPots = state.inventory.mpPotions !== undefined ? state.inventory.mpPotions : 0;
        const hpPotionsSpan = document.getElementById('hud-hp-potions-count');
        if (hpPotionsSpan) hpPotionsSpan.innerText = hpPots;
        const mpPotionsSpan = document.getElementById('hud-mp-potions-count');
        if (mpPotionsSpan) mpPotionsSpan.innerText = mpPots;

        // Quest HUD update
        const questBox = document.querySelector('.active-quest-hud');
        if (world.activeQuest) {
            questBox.style.display = 'block';
            document.getElementById('hud-quest-title').innerText = world.activeQuest.title;
            const progressPercent = Math.min(100, (world.activeQuest.progress / world.activeQuest.target) * 100);
            document.getElementById('hud-quest-progress-fill').style.width = `${progressPercent}%`;
        } else {
            questBox.style.display = 'none';
        }
    }

    /**
     * Swaps visible views inside main container
     */
    switchTab(tabId) {
        if (!window.gameState.state) return;

        document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));
        document.querySelectorAll('#bottom-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));

        const targetView = document.getElementById(`view-${tabId}`);
        if (targetView && tabId !== 'city') targetView.classList.remove('hidden');

        const eventBtn = Array.from(document.querySelectorAll('#bottom-tabs .tab-btn'))
            .find(btn => btn.innerText.toLowerCase().includes(tabId === 'combat' ? 'bramy' : (tabId === 'party' ? 'drużyna' : (tabId === 'skills' ? 'umiejętności' : 'eksploracja'))));
        if (eventBtn) eventBtn.classList.add('active');

        document.getElementById('location-exploration').classList.add('hidden');

        if (tabId === 'city') {
            if (this.currentLocationId) {
                this.enterCityLocation(this.currentLocationId);
            } else {
                document.getElementById('view-city').classList.remove('hidden');
            }
        }

        if (tabId === 'party') this.renderPartyTab();
        if (tabId === 'skills') this.renderSkillsTab();
        if (tabId === 'combat') this.renderGatesTab();
        
        this.updateHUD();
    }

    /**
     * Character Creator stat adjustment +/- helpers
     */
    adjustStartingStat(stat, amount) {
        if (amount > 0 && this.availablePoints > 0) {
            this.tempStats[stat]++;
            this.availablePoints--;
        } else if (amount < 0 && this.tempStats[stat] > 10) {
            this.tempStats[stat]--;
            this.availablePoints++;
        }

        document.getElementById('starting-points-count').innerText = this.availablePoints;
        document.getElementById(`start-${stat}`).innerText = this.tempStats[stat];
    }

    confirmCharacterCreation() {
        const nameInput = document.getElementById('player-name-input').value.trim();
        if (nameInput.length < 2) {
            alert('Imię łowcy musi składać się z co najmniej 2 znaków.');
            return;
        }

        // Save new profile slot
        window.gameState.saveNewProfile(nameInput, this.tempStats, this.activeAvatar, this.activeTalent);

        // Initialize starting hp/mp in state
        const playerStats = window.classSystem.calculateDerivedStats(window.gameState.state.player);
        window.gameState.state.player.hp = playerStats.maxHp;
        window.gameState.state.player.mp = playerStats.maxMp;

        document.getElementById('character-creator').classList.add('hidden');
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Binding avatar
        let avatarHtml = '<i class="fa-solid fa-user-secret"></i>';
        if (this.activeAvatar === 'avatar_flame') avatarHtml = '<i class="fa-solid fa-fire"></i>';
        else if (this.activeAvatar === 'avatar_shield') avatarHtml = '<i class="fa-solid fa-shield-cat"></i>';
        else if (this.activeAvatar === 'avatar_hunter') avatarHtml = '<i class="fa-solid fa-crosshairs"></i>';
        document.getElementById('hud-avatar-icon').innerHTML = avatarHtml;

        this.updateHUD();
        this.renderPartyTab();
        this.renderSkillsTab();
        this.renderGatesTab();
        this.switchTab('city');
        
        this.showSystemAlert(`[PRZEBUDZENIE GRACZA]\nWitaj, Łowco ${nameInput}.\nSystem otworzył dla Ciebie bramę nieskończonego rozwoju. Rozpocznij eksplorację miasta i wejdź do pierwszego lochu w Sektorze Bram!`);
    }

    /**
     * Systems Alerts visual handler (Solo Leveling popups)
     */
    showSystemAlert(text) {
        const modal = document.getElementById('system-alert-popup');
        document.getElementById('system-alert-text').innerText = text;
        modal.classList.remove('hidden');
    }

    closeSystemAlert() {
        document.getElementById('system-alert-popup').classList.add('hidden');
    }

    /**
     * CITY MAP: Enter specific locations and load dialogues or action choices
     */
    enterCityLocation(locId) {
        this.currentLocationId = locId;
        const locData = window.citySystem.locations[locId];
        if (!locData) return;

        document.getElementById('view-city').classList.add('hidden');
        const explorePanel = document.getElementById('location-exploration');
        explorePanel.classList.remove('hidden');

        document.getElementById('location-explore-title').innerText = locData.name;
        document.getElementById('location-explore-desc').innerText = locData.desc;

        const actionsArea = document.getElementById('location-action-area');
        actionsArea.innerHTML = '';

        if (locId === 'home') {
            const prestigeState = window.gameState.state.prestige;
            const upg = prestigeState.upgrades;

            actionsArea.innerHTML = `
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-bed"></i> Odpoczynek i Sen</h4>
                    <p>W pełni regeneruje punkty HP oraz MP Twojego bohatera (Gamer's Body).</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeHomeRest()">IDŹ SPAĆ (Regen)</button>
                </div>
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-fire-burner"></i> Daily Quest (Trening)</h4>
                    <p>100 pompek, brzuszków, przysiadów i 10km biegu. Trwa 4h. Podnosi STR/DEX/VIT o +1.</p>
                    <button class="neon-btn violet-btn" onclick="window.uiEngine.executeDailyQuest()">TRENUJ (Daily Quest)</button>
                </div>

                <!-- PRESTIGE PANEL (ABYSS BREAKTHROUGH) -->
                <div class="location-action-card glass-panel" style="grid-column: span 2; border-color: var(--violet-neon); margin-top: 15px;">
                    <h4 class="violet-neon glowing-text"><i class="fa-solid fa-burst"></i> PRZEŁOM OTCHŁANI (Prestiż / Odrodzenie)</h4>
                    <p style="font-size: 11px;">Osiągnij poziom 30, aby zresetować poziom bohatera (wracasz na Lvl 1 z bazowymi statystykami) w zamian za <strong>Odłamki Otchłani (Abyss Shards)</strong>. Odłamki pozwalają na zakup permanentnych ulepszeń.</p>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 12px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        <span>Posiadane Odłamki Otchłani: <strong class="violet-neon glowing-text" style="font-size: 16px;">${prestigeState.abyssShards}</strong></span>
                        <span>Wykonane Przełomy: <strong>${prestigeState.count}</strong></span>
                    </div>

                    <button class="neon-btn violet-btn" onclick="window.uiEngine.executePrestigeBreakthrough()">DOKONAJ PRZEŁOMU (Reset Lvl)</button>

                    <h5 style="margin-top: 20px; font-family: var(--font-heading); font-size: 12px; color: var(--text-muted);">SKLEP STAŁYCH ULEPSZEŃ OTCHŁANI:</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px;">
                        <div class="glass-panel" style="padding: 10px; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between;">
                            <span><strong>Mnożnik Mocy (Lvl ${upg.power})</strong><br>+25% DMG całej drużyny<br>Koszt: <strong class="violet-neon">${upg.power + 1} Odłamków</strong></span>
                            <button class="neon-btn cyan-btn" style="padding: 4px 8px; font-size: 9px; margin-top: 8px;" onclick="window.uiEngine.executePrestigeUpgrade('power')">KUP ULEPSZENIE</button>
                        </div>
                        <div class="glass-panel" style="padding: 10px; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between;">
                            <span><strong>Szybki Krok (Lvl ${upg.haste})</strong><br>+5% Haste (Cooldown Red)<br>Koszt: <strong class="violet-neon">${upg.haste + 1} Odłamków</strong></span>
                            <button class="neon-btn cyan-btn" style="padding: 4px 8px; font-size: 9px; margin-top: 8px;" onclick="window.uiEngine.executePrestigeUpgrade('haste')">KUP ULEPSZENIE</button>
                        </div>
                        <div class="glass-panel" style="padding: 10px; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between;">
                            <span><strong>Przyciąganie Złota (Lvl ${upg.gold})</strong><br>+20% Złota z Bram<br>Koszt: <strong class="violet-neon">${upg.gold + 1} Odłamków</strong></span>
                            <button class="neon-btn cyan-btn" style="padding: 4px 8px; font-size: 9px; margin-top: 8px;" onclick="window.uiEngine.executePrestigeUpgrade('gold')">KUP ULEPSZENIE</button>
                        </div>
                        <div class="glass-panel" style="padding: 10px; font-size: 11px; display: flex; flex-direction: column; justify-content: space-between;">
                            <span><strong>Zgięcie Czasu (Lvl ${upg.time})</strong><br>Cykl w mieście szybszy o 10%<br>Koszt: <strong class="violet-neon">${upg.time + 1} Odłamków</strong></span>
                            <button class="neon-btn cyan-btn" style="padding: 4px 8px; font-size: 9px; margin-top: 8px;" onclick="window.uiEngine.executePrestigeUpgrade('time')">KUP ULEPSZENIE</button>
                        </div>
                    </div>
                </div>
            `;
        } else if (locId === 'academy') {
            actionsArea.innerHTML = `
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-brain"></i> Studiowanie Teorii Magii</h4>
                    <p>Spędź 4 godziny na studiowaniu ksiąg w bibliotece. Koszt: 50 G. Podnosi statystykę Inteligencji (INT) o +1.</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeAcademyStudy('int')">STUDIUJ INT (50G)</button>
                </div>
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-book-open"></i> Studiowanie Mądrości</h4>
                    <p>Zgłębiaj sekrety starożytnych tekstów magicznych. Koszt: 50 G. Podnosi Mądrość (WIS) o +1.</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeAcademyStudy('wis')">STUDIUJ WIS (50G)</button>
                </div>
            `;
        } else if (locId === 'training') {
            actionsArea.innerHTML = `
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-dumbbell"></i> Trening Siłowy (STR)</h4>
                    <p>Trening siłowy na siłowni. Koszt: 100 G. Trwa 4h. STR +2.</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeTrainingCenter('str')">ĆWICZ STR (100G)</button>
                </div>
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-bolt"></i> Ćwiczenia Zwinności (DEX)</h4>
                    <p>Trening refleksu i szybkości. Koszt: 100 G. Trwa 4h. DEX +2.</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeTrainingCenter('dex')">ĆWICZ DEX (100G)</button>
                </div>
            `;
        } else if (locId === 'shopping') {
            actionsArea.innerHTML = `
                <!-- 1. BUTIK Z PREZENTAMI -->
                <div class="location-action-card glass-panel" style="grid-column: span 2;">
                    <h4 class="glowing-text" style="color: #00f0ff;"><i class="fa-solid fa-gift"></i> Butik "Różany Zakątek" (Prezenty)</h4>
                    <p>Zakup wyjątkowe podarki dla przyjaciół w Butiku, by zwiększyć ich Sympatię (Affection) [Najeżdżaj na przedmioty, by sprawdzić ich działanie]:</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button class="neon-btn cyan-btn tooltip-down" onclick="window.uiEngine.buyGift('lilac_flowers')" data-tooltip="Kwiaty Bzu (150 Gold)&#10;Piękne fioletowe kwiaty o intensywnym zapachu.&#10;Wpływ na Sympatię:&#10;- Lee Min-Ah: +15 (Ulubiony!)&#10;- Shin Yu-Na: +8&#10;- Park Jin-Soo: +2">Kwiaty Bzu (150G)</button>
                        <button class="neon-btn cyan-btn tooltip-down" onclick="window.uiEngine.buyGift('energy_drink')" data-tooltip="Napój Energetyczny (50 Gold)&#10;Napój gazowany o smaku kwaśnej borówki. Idealny na trening.&#10;Wpływ na Sympatię:&#10;- Park Jin-Soo: +12 (Ulubiony!)&#10;- Shin Yu-Na: +3&#10;- Lee Min-Ah: +1">Energetyk (50G)</button>
                        <button class="neon-btn cyan-btn tooltip-down" onclick="window.uiEngine.buyGift('macarons')" data-tooltip="Słodkie Makaroniki (100 Gold)&#10;Pudełko kolorowych ciasteczek migdałowych z kremem.&#10;Wpływ na Sympatię:&#10;- Shin Yu-Na: +15 (Ulubiony!)&#10;- Lee Min-Ah: +7&#10;- Park Jin-Soo: +4">Makaroniki (100G)</button>
                        <button class="neon-btn cyan-btn tooltip-down" onclick="window.uiEngine.buyGift('silver_ring')" data-tooltip="Srebrny Pierścień (1000 Gold)&#10;Drogocenny pierścionek ze szlachetnego metalu.&#10;Wpływ na Sympatię:&#10;- Lee Min-Ah: +25 (Ekstremalnie lubi!)&#10;- Shin Yu-Na: +25 (Ekstremalnie lubi!)&#10;- Park Jin-Soo: +20 (Ekstremalnie lubi!)">Srebrny Pierścień (1000G)</button>
                    </div>
                </div>

                <!-- 2. APTEKA STOWARZYSZENIA -->
                <div class="location-action-card glass-panel" style="grid-column: span 1;">
                    <h4 class="glowing-text" style="color: #f44336;"><i class="fa-solid fa-prescription-bottle-medical"></i> Apteka Stowarzyszenia (Mikstury)</h4>
                    <p>Eliksiry regenerujące do lochów. HP przywraca zdrowie przy <35% HP. MP odnawia manę przy <20% MP [Koszt: 40 G]:</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button class="neon-btn tooltip-down" style="border-color: #f44336; color: #f44336; background: rgba(244,67,54,0.15);" onclick="window.uiEngine.buyPotion('hp')" data-tooltip="Mikstura HP (40 Gold)&#10;Używana automatycznie w lochach Bramy, gdy HP postaci w drużynie spadnie poniżej 35%. Przywraca 40% maksymalnego HP.">Kup Miksturę HP</button>
                        <button class="neon-btn tooltip-down" style="border-color: #2196f3; color: #2196f3; background: rgba(33,150,243,0.15);" onclick="window.uiEngine.buyPotion('mp')" data-tooltip="Mikstura MP (40 Gold)&#10;Używana automatycznie w lochach Bramy, gdy MP postaci w drużynie spadnie poniżej 20%. Przywraca 40% maksymalnego MP.">Kup Miksturę MP</button>
                    </div>
                </div>

                <!-- 3. ZBROJOWNIA SEKTORA (RUSZNIKARZ) -->
                <div class="location-action-card glass-panel" style="grid-column: span 1;">
                    <h4 class="glowing-text" style="color: #9c27b0;"><i class="fa-solid fa-shield-halved"></i> Zbrojownia Sektora "Rusznikarz"</h4>
                    <p>Zakup Rare (Niebieski) rynsztunek łowców posiadający certyfikowane bonusy do statystyk stałych oraz bojowych:</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button class="neon-btn violet-btn tooltip-down" onclick="window.uiEngine.buyShopGear('weapon')" data-tooltip="Miecz Żelaznego Łowcy [Niebieski] (350 Gold)&#10;Broń jednoręczna.&#10;Daje:&#10;+6 do STR (Siła)&#10;+4 do DEX (Zręczność)&#10;+15 PATK&#10;+2% do ciosów krytycznych.">Miecz (350G)</button>
                        <button class="neon-btn violet-btn tooltip-down" onclick="window.uiEngine.buyShopGear('armor')" data-tooltip="Pancerz Strażnika [Niebieski] (350 Gold)&#10;Ciężka płyta.&#10;Daje:&#10;+3 do STR&#10;+8 do VIT&#10;+25 maks. HP.">Zbroja (350G)</button>
                        <button class="neon-btn violet-btn tooltip-down" onclick="window.uiEngine.buyShopGear('ring')" data-tooltip="Runiczny Sygnet Maga [Niebieski] (400 Gold)&#10;Magiczny pierścień.&#10;Daje:&#10;+8 do INT&#10;+5 do WIS.">Sygnet (400G)</button>
                    </div>
                </div>
            `;
        } else if (locId === 'abyss_market') {
            actionsArea.innerHTML = `
                <div class="location-action-card glass-panel" style="grid-column: span 2;">
                    <h4><i class="fa-solid fa-scroll"></i> Nielegalny Czarny Rynek Zwojów Zaklęć</h4>
                    <p>Zakup potężne księgi czarów, z których Twoje postacie mogą uczyć się nowych umiejętności [Najeżdżaj na przedmioty, by sprawdzić efekty]:</p>
                    <div style="display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap;">
                        <button class="neon-btn violet-btn" onclick="window.uiEngine.buySpellBook('book_fireball')" data-tooltip="Księga Czaru: Kula Ognia (300 Gold)&#10;Ciska ognistym pociskiem zadającym wysokie obrażenia magiczne.&#10;Statystyki czaru:&#10;- Obrażenia: 130% + 20% za poziom (skaluje się z MATK)&#10;- Koszt many: 15 MP&#10;- Czas odnowienia: 5s&#10;- Dozwolone dla klas: Mage, Novice">Kula Ognia (300G)</button>
                        <button class="neon-btn violet-btn" onclick="window.uiEngine.buySpellBook('book_heal')" data-tooltip="Księga Czaru: Leczenie (300 Gold)&#10;Przywraca zdrowie sojusznikowi w drużynie, który ma najmniej HP.&#10;Statystyki czaru:&#10;- Siła leczenia: 150% + 25% za poziom (skaluje się z MATK)&#10;- Koszt many: 15 MP&#10;- Czas odnowienia: 5s&#10;- Dozwolone dla klas: Cleric, Novice">Leczenie (300G)</button>
                        <button class="neon-btn violet-btn" onclick="window.uiEngine.buySpellBook('book_mana_shield')" data-tooltip="Księga Czaru: Tarcza Mana (400 Gold)&#10;Tworzy wokół rzucającego osłonę absorbującą obrażenia kosztem many.&#10;Statystyki czaru:&#10;- Wytrzymałość tarczy: 30% + 5% za poziom maksymalnej many (Max MP)&#10;- Koszt many: 20 MP&#10;- Czas odnowienia: 12s&#10;- Dozwolone dla klas: Mage, Cleric, Novice">Tarcza Mana (400G)</button>
                        <button class="neon-btn violet-btn" onclick="window.uiEngine.buySpellBook('book_provoke')" data-tooltip="Księga Czaru: Prowokacja (250 Gold)&#10;Okrzyk wojenny ściągający ataki wszystkich potworów w lochu na siebie.&#10;Statystyki czaru:&#10;- Efekt: +50 do Agro (Prowokuje bossów i potwory)&#10;- Koszt many: 12 MP&#10;- Czas odnowienia: 8s&#10;- Dozwolone dla klas: Warrior, Knight, Berserker">Prowokacja (250G)</button>
                        <button class="neon-btn violet-btn" onclick="window.uiEngine.buySpellBook('book_quick_cut')" data-tooltip="Księga Czaru: Szybkie Cięcie (300 Gold)&#10;Błyskawiczne pchnięcie sztyletem, które ignoruje część pancerza wroga.&#10;Statystyki czaru:&#10;- Obrażenia: 110% + 10% za poziom (skaluje się z PATK)&#10;- Koszt many: 10 MP&#10;- Czas odnowienia: 3s&#10;- Dozwolone dla klas: Assassin, Novice">Szybkie Cięcie (300G)</button>
                    </div>
                </div>
            `;
        } else if (locId === 'association') {
            actionsArea.innerHTML = `
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-arrows-rotate"></i> Wymiana Kryształów Many</h4>
                    <p>Sprzedaj zdobyte w Bramach kryształy na legalne Złoto Stowarzyszenia. Kurs: 1 Kryształ = 10 Gold.</p>
                    <button class="neon-btn cyan-btn" onclick="window.uiEngine.executeSellCrystals()">SPRZEDAJ WSZYSTKO</button>
                </div>
                <div class="location-action-card glass-panel">
                    <h4><i class="fa-solid fa-id-card"></i> Biuro Wynajmu Najemników</h4>
                    <p>Wynajmij losowych łowców o stałych statystykach na pojedynczą wyprawę. Koszt: 200 Gold.</p>
                    <button class="neon-btn violet-btn" onclick="window.uiEngine.executeHireMercenary()">WYNAJMIJ POMOCNIKA (200G)</button>
                </div>
            `;
        }

        // NPC dialogue check
        const npcInteraction = document.getElementById('npc-interaction-panel');
        let activeNpcId = null;

        ['min_ah', 'jin_soo', 'yu_na'].forEach(id => {
            const loc = window.citySystem.getNpcLocation(id);
            if (loc === locId) {
                activeNpcId = id;
            }
        });

        if (activeNpcId) {
            npcInteraction.classList.remove('hidden');
            const companion = window.gameState.state.companions[activeNpcId];
            
            document.getElementById('npc-active-name').innerText = companion.name;
            document.getElementById('npc-trust-val').innerText = companion.trust;
            document.getElementById('npc-affection-val').innerText = companion.affection;
            
            const talkStatus = companion.recruited ? 
                `"Uśmiecha się lojalnie: Jestem gotowa/y na kolejną wyprawę, Gracz!"` :
                `"Witaj... szukasz kogoś do rozmowy czy planujesz kolejny rajd w Bramach?"`;
            document.getElementById('npc-dialogue-text').innerText = talkStatus;

            const choices = document.getElementById('dialogue-choices');
            choices.innerHTML = '';

            if (!companion.recruited) {
                choices.innerHTML = `
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.executeNpcTalk('${activeNpcId}')"><i class="fa-solid fa-comments"></i> Porozmawiaj (Zaufanie)</button>
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.showGiftList('${activeNpcId}')"><i class="fa-solid fa-gift"></i> Wręcz Prezent (Sympatia)</button>
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.executeNpcDate('${activeNpcId}')"><i class="fa-solid fa-heart"></i> Zaproś na Spacer (100G)</button>
                    <button class="dialogue-choice-btn glowing-text cyan-neon" onclick="window.uiEngine.executeNpcRecruit('${activeNpcId}')"><i class="fa-solid fa-user-plus"></i> Zaproś do Drużyny</button>
                `;
            } else {
                choices.innerHTML = `
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.executeNpcTalk('${activeNpcId}')"><i class="fa-solid fa-comments"></i> Pogawędka</button>
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.showGiftList('${activeNpcId}')"><i class="fa-solid fa-gift"></i> Wręcz Upominek</button>
                    <button class="dialogue-choice-btn" onclick="window.uiEngine.executeNpcDate('${activeNpcId}')"><i class="fa-solid fa-heart"></i> Zorganizuj Randkę (100G)</button>
                `;
            }

        } else {
            npcInteraction.classList.add('hidden');
        }
    }

    leaveLocation() {
        document.getElementById('location-exploration').classList.add('hidden');
        document.getElementById('view-city').classList.remove('hidden');
        this.currentLocationId = null;
        this.updateHUD();
    }

    /**
     * PRESTIGE ACTION BREAKTHROUGHS HOOKS
     */
    executePrestigeBreakthrough() {
        const report = window.gameState.executePrestige();
        if (report.success) {
            this.showSystemAlert(`[PRZEŁOM OTCHŁANI DOKONANY]\nDoświadczyłeś metafizycznego Odrodzenia.\nZwróciłeś się z poziomu Lvl 1 do statystyk bazowych, ale zyskujesz: +${report.shards} Odłamków Otchłani! Użyj ich, by kupić permanentne bonusy.`);
            this.enterCityLocation('home');
            this.updateHUD();
        } else {
            alert(report.reason);
        }
    }

    executePrestigeUpgrade(upgradeId) {
        const check = window.gameState.buyPrestigeUpgrade(upgradeId);
        if (check) {
            alert('Zakupiono stałe ulepszenie Otchłani!');
            this.enterCityLocation('home');
            this.updateHUD();
        } else {
            alert('Nie posiadasz wystarczającej liczby Odłamków Otchłani na to ulepszenie.');
        }
    }

    /**
     * REST, WORKOUT, QUEST HOOKS
     */
    executeHomeRest() {
        const state = window.gameState.state;
        const playerStats = window.classSystem.calculateDerivedStats(state.player);
        
        state.player.hp = playerStats.maxHp;
        state.player.mp = playerStats.maxMp;
        state.player.fatigue = 0;
        
        window.citySystem.advanceTime(8);
        window.gameState.save();

        this.showSystemAlert(`[ZREGENEROWANO]\nPrzespałeś się 8 godzin w swoim mieszkaniu.\nTwoje HP, MP oraz Zmęczenie (Fatigue) zostały w pełni oczyszczone i odnowione!`);
        this.enterCityLocation('home');
    }

    executeDailyQuest() {
        const report = window.questSystem.doDailyQuest();
        if (report.success) {
            this.showSystemAlert(report.text);
            this.enterCityLocation('home');
        } else {
            alert(report.reason);
        }
    }

    executeAcademyStudy(stat) {
        const state = window.gameState.state;
        if (state.inventory.gold < 50) {
            alert('Studiowanie w Akademii wymaga 50 sztuk złota.');
            return;
        }

        state.inventory.gold -= 50;
        state.player.stats[stat] += 1;
        window.citySystem.advanceTime(4);
        window.gameState.save();

        this.showSystemAlert(`[STUDIA ZAKOŃCZONE]\nSpędziłeś 4 godziny analizując magiczne księgi.\nZyskujesz: +1 do ${stat.toUpperCase()}!`);
        this.enterCityLocation('academy');
    }

    executeTrainingCenter(stat) {
        const state = window.gameState.state;
        if (state.inventory.gold < 100) {
            alert('Sesja treningowa wymaga 100 sztuk złota.');
            return;
        }

        state.inventory.gold -= 100;
        state.player.stats[stat] += 2;
        window.citySystem.advanceTime(4);
        window.gameState.save();

        this.showSystemAlert(`[SESJA TRENINGOWA ZAKOŃCZONA]\nSpędziłeś 4 godziny na ciężkim sparringu na siłowni.\nZyskujesz: +2 do ${stat.toUpperCase()}!`);
        this.enterCityLocation('training');
    }

    buyGift(giftId) {
        const state = window.gameState.state;
        const giftCost = giftId === 'silver_ring' ? 1000 : (giftId === 'lilac_flowers' ? 150 : (giftId === 'macarons' ? 100 : 50));
        
        if (state.inventory.gold < giftCost) {
            alert('Nie posiadasz wystarczającej ilości złota na ten zakup.');
            return;
        }

        state.inventory.gold -= giftCost;
        state.inventory.gifts[giftId]++;
        window.gameState.save();

        alert(`Zakupiono prezent!`);
        this.updateHUD();
    }

    buyPotion(type) {
        const state = window.gameState.state;
        const cost = 40;
        
        if (state.inventory.gold < cost) {
            alert('Nie posiadasz wystarczającej ilości złota na miksturę (wymagane 40 Gold).');
            return;
        }

        if (state.inventory.hpPotions === undefined) state.inventory.hpPotions = 0;
        if (state.inventory.mpPotions === undefined) state.inventory.mpPotions = 0;

        // Verify backpack capacity (20 slot limit)
        const hpPots = state.inventory.hpPotions;
        const mpPots = state.inventory.mpPotions;
        const slotsUsed = state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
        let willNeedNewSlot = false;
        if (type === 'hp' && hpPots === 0) willNeedNewSlot = true;
        if (type === 'mp' && mpPots === 0) willNeedNewSlot = true;

        if (willNeedNewSlot && slotsUsed >= 20) {
            alert('Twój plecak jest pełen! (Maksymalnie 20 miejsc). Zużyj mikstury lub sprzedaj niepotrzebny sprzęt.');
            return;
        }

        state.inventory.gold -= cost;
        if (type === 'hp') {
            state.inventory.hpPotions++;
        } else {
            state.inventory.mpPotions++;
        }
        
        window.gameState.save();
        alert(`Zakupiono miksturę!`);
        this.updateHUD();
        this.enterCityLocation('shopping'); // Refresh shop view
    }

    buyShopGear(gearType) {
        const state = window.gameState.state;
        const cost = gearType === 'ring' ? 400 : 350;

        if (state.inventory.gold < cost) {
            alert(`Nie posiadasz wystarczającej ilości złota (wymagane ${cost} Gold).`);
            return;
        }

        // Verify backpack capacity (20 slot limit)
        const hpPots = state.inventory.hpPotions !== undefined ? state.inventory.hpPotions : 0;
        const mpPots = state.inventory.mpPotions !== undefined ? state.inventory.mpPotions : 0;
        const slotsUsed = state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);

        if (slotsUsed >= 20) {
            alert('Twój plecak jest pełen! (Maksymalnie 20 miejsc). Sprzedaj niepotrzebny rynsztunek, aby zwolnić miejsce.');
            return;
        }

        state.inventory.gold -= cost;

        let gearItem = null;
        if (gearType === 'weapon') {
            gearItem = {
                id: `gear_shop_wpn_${Date.now()}`,
                name: 'Miecz Żelaznego Łowcy',
                rarity: 'Niebieski',
                type: 'weapon',
                stats: { str: 6, dex: 4, vit: 0, int: 0, wis: 0, luk: 0 },
                derived: { hp: 0, mp: 0, patk: 15, matk: 0, crit: 2 }
            };
        } else if (gearType === 'armor') {
            gearItem = {
                id: `gear_shop_arm_${Date.now()}`,
                name: 'Pancerz Strażnika',
                rarity: 'Niebieski',
                type: 'armor',
                stats: { str: 3, dex: 0, vit: 8, int: 0, wis: 0, luk: 0 },
                derived: { hp: 25, mp: 0, patk: 0, matk: 0, crit: 0 }
            };
        } else if (gearType === 'ring') {
            gearItem = {
                id: `gear_shop_rng_${Date.now()}`,
                name: 'Runiczny Sygnet Maga',
                rarity: 'Niebieski',
                type: 'ring',
                stats: { str: 0, dex: 0, vit: 0, int: 8, wis: 5, luk: 0 },
                derived: { hp: 0, mp: 0, patk: 0, matk: 0, crit: 0 }
            };
        }

        state.inventory.gear.push(gearItem);
        window.gameState.save();
        
        alert(`Zakupiono przedmiot: ${gearItem.name}! Znajdziesz go w zakładce Drużyna i możesz go założyć.`);
        this.updateHUD();
        this.enterCityLocation('shopping'); // Refresh shop view
    }

    buySpellBook(bookId) {
        const state = window.gameState.state;
        const bookCost = bookId === 'book_mana_shield' || bookId === 'book_aimed_shot' ? 400 : (bookId === 'book_provoke' ? 250 : 300);

        if (state.inventory.gold < bookCost) {
            alert('Nie posiadasz wystarczającej ilości złota na ten zwój magiczny.');
            return;
        }

        state.inventory.gold -= bookCost;
        state.inventory.skillBooks.push(bookId);
        window.gameState.save();

        alert(`Zakupiono zwój czaru: ${bookId}! Możesz nauczyć się go w oknie zakładek Umiejętności.`);
        this.updateHUD();
    }

    executeSellCrystals() {
        const state = window.gameState.state;
        if (state.inventory.manaCrystals <= 0) {
            alert('Nie posiadasz żadnych kryształów many do sprzedaży.');
            return;
        }

        const goldEarned = state.inventory.manaCrystals * 10;
        state.inventory.gold += goldEarned;
        const soldCount = state.inventory.manaCrystals;
        state.inventory.manaCrystals = 0;
        
        window.gameState.save();
        alert(`Sprzedano ${soldCount} kryształów za ${goldEarned} złota!`);
        this.enterCityLocation('association');
    }

    executeHireMercenary() {
        const state = window.gameState.state;
        if (state.inventory.gold < 200) {
            alert('Wynajem najemnika kosztuje 200 złota.');
            return;
        }

        if (state.mercenaries.length >= 2) {
            alert('Możesz wynająć maksymalnie 2 najemników naraz.');
            return;
        }

        state.inventory.gold -= 200;

        const mercClasses = ['Warrior', 'Mage', 'Assassin', 'Ranger', 'Cleric'];
        const chosenClass = mercClasses[Math.floor(Math.random() * mercClasses.length)];
        const names = ['Kowalski', 'Lee', 'Kim', 'Park', 'Zieliński', 'Choi'];
        const randomName = names[Math.floor(Math.random() * names.length)];

        const lvl = state.player.level;
        const dummyStats = {
            str: 10 + lvl * 2,
            dex: 10 + lvl * 2,
            vit: 10 + lvl * 2,
            int: 10 + lvl * 2,
            wis: 10 + lvl * 2,
            luk: 10 + lvl * 2
        };

        const charDummy = {
            level: lvl,
            currentClass: chosenClass,
            stats: dummyStats
        };

        const derived = window.classSystem.calculateDerivedStats(charDummy);

        state.mercenaries.push({
            id: `merc_${Date.now()}`,
            name: `${chosenClass} ${randomName}`,
            classId: chosenClass,
            level: lvl,
            maxHp: derived.maxHp,
            maxMp: derived.maxMp,
            derived: derived,
            skills: [],
            equippedSkills: chosenClass === 'Warrior' ? ['provoke'] : (chosenClass === 'Mage' ? ['fireball'] : (chosenClass === 'Cleric' ? ['heal'] : ['strike']))
        });

        window.gameState.save();
        alert(`Wynajęto pomocnika: ${chosenClass} ${randomName}! Pomaga Ci w kolejnym jednym rajdzie.`);
        this.enterCityLocation('association');
    }

    /**
     * NPC VN INTERACTIVE TRIGGERS
     */
    executeNpcTalk(npcId) {
        const report = window.citySystem.talkToNpc(npcId);
        document.getElementById('npc-dialogue-text').innerText = report.text;
        
        if (npcId === 'yu_na') {
            const completed = window.questSystem.triggerTalkQuestCompletion('yu_na');
            if (completed) {
                this.showSystemAlert(`[ZADANIE UKOŃCZONE] Wstęp do Otchłani!\nOdblokowano kolejne zadanie rekrutacyjne.`);
            }
        }

        this.enterCityLocation(this.currentLocationId);
    }

    showGiftList(npcId) {
        const state = window.gameState.state;
        const gifts = state.inventory.gifts;
        let giftHtml = '<p class="label" style="grid-column: span 2;">WYBIERZ PODAREK Z PLECAKA:</p>';

        let hasGift = false;
        for (let giftId in gifts) {
            if (gifts[giftId] > 0) {
                hasGift = true;
                const giftName = giftId === 'silver_ring' ? 'Srebrny Pierścień' : (giftId === 'lilac_flowers' ? 'Kwiaty Bzu' : (giftId === 'macarons' ? 'Makaroniki' : 'Energetyk'));
                giftHtml += `<button class="dialogue-choice-btn" onclick="window.uiEngine.executeNpcGift('${npcId}', '${giftId}')">${giftName} (Posiadasz: ${gifts[giftId]})</button>`;
            }
        }

        if (!hasGift) {
            giftHtml += '<p style="grid-column: span 2; font-style: italic; font-size: 11px;">Twój plecak z prezentami jest pusty. Kup prezenty w Dzielnicy Handlowej!</p>';
        }

        giftHtml += `<button class="dialogue-choice-btn" style="grid-column: span 2; text-align: center; border-color: rgba(255, 64, 129, 0.4);" onclick="window.uiEngine.enterCityLocation('${this.currentLocationId}')">ANULUJ</button>`;
        
        document.getElementById('dialogue-choices').innerHTML = giftHtml;
    }

    executeNpcGift(npcId, giftId) {
        const report = window.citySystem.giveGiftToNpc(npcId, giftId);
        if (report.success) {
            document.getElementById('npc-dialogue-text').innerText = report.text;
            this.enterCityLocation(this.currentLocationId);
        } else {
            alert(report.reason);
        }
    }

    executeNpcDate(npcId) {
        const report = window.citySystem.goOnDate(npcId);
        if (report.success) {
            this.showSystemAlert(`[RANDKA UDANA]\n${report.text}`);
            this.enterCityLocation(this.currentLocationId);
        } else {
            alert(report.reason);
        }
    }

    executeNpcRecruit(npcId) {
        const report = window.citySystem.recruitCompanion(npcId);
        if (report.success) {
            this.showSystemAlert(`[NOWY TOWARZYSZ DRUŻYNY]\n${report.text}`);
            this.enterCityLocation(this.currentLocationId);
        } else {
            alert(report.reason);
        }
    }

    /**
     * WIDOK 2: DRUŻYNA RENDEROWANIE I METODY
     */
    selectCompanion(companionId) {
        this.selectedCompanionId = companionId;
        this.renderPartyTab();
    }

    renderPartyTab() {
        const state = window.gameState.state;
        if (!state) return;
        
        // 1. Active Squad Slots
        const activeContainer = document.getElementById('active-party-slots');
        activeContainer.innerHTML = '';

        state.party.forEach(id => {
            const char = id === 'player' ? state.player : state.companions[id];
            const isSel = this.selectedCompanionId === id ? 'selected' : '';
            
            activeContainer.innerHTML += `
                <div class="char-slot ${isSel} cursor-pointer" onclick="window.uiEngine.selectCompanion('${id}')">
                    <div class="info">
                        <span class="name">${char.name}</span>
                        <span class="lvl-cls">Lvl ${char.level} | ${char.currentClass}</span>
                    </div>
                    <div class="statusGlowing font-heading glowing-text" style="color: var(--cyan-neon); font-size: 11px;">AKTYWNY</div>
                </div>
            `;
        });

        // 2. Reserve list
        const reserveContainer = document.getElementById('reserve-party-slots');
        reserveContainer.innerHTML = '';

        for (let id in state.companions) {
            const comp = state.companions[id];
            if (comp.recruited && !state.party.includes(id)) {
                const isSel = this.selectedCompanionId === id ? 'selected' : '';
                reserveContainer.innerHTML += `
                    <div class="char-slot ${isSel} cursor-pointer" onclick="window.uiEngine.selectCompanion('${id}')">
                        <div class="info">
                            <span class="name">${comp.name}</span>
                            <span class="lvl-cls">Lvl ${comp.level} | ${comp.currentClass}</span>
                        </div>
                        <button class="neon-btn cyan-btn" style="padding: 4px 8px; font-size: 9px;" onclick="window.uiEngine.equipCompanionToParty('${id}')">USTAW W SKŁADZIE</button>
                    </div>
                `;
            } else if (!comp.recruited) {
                reserveContainer.innerHTML += `
                    <div class="char-slot" style="opacity: 0.6; cursor: default;">
                        <div class="info">
                            <span class="name">${comp.name} (Zablokowana)</span>
                            <span class="lvl-cls">Zaufanie: ${comp.trust}/100</span>
                        </div>
                        <span class="badge" style="background: rgba(244, 67, 54, 0.2); color: #f44336;">NIEZREKRUTOWANY</span>
                    </div>
                `;
            }
        }

        // 3. Render Detail Sheet for Selected
        const selectedId = this.selectedCompanionId;
        const char = selectedId === 'player' ? state.player : state.companions[selectedId];
        
        if (char) {
            document.getElementById('char-sheet-content').classList.remove('hidden');
            document.getElementById('selected-char-name').innerText = char.name;
            document.getElementById('char-class-badge').innerText = char.currentClass;
            document.getElementById('char-level-val').innerText = char.level;

            // Stats
            document.getElementById('char-stat-str').innerText = char.stats.str;
            document.getElementById('char-stat-dex').innerText = char.stats.dex;
            document.getElementById('char-stat-vit').innerText = char.stats.vit;
            document.getElementById('char-stat-int').innerText = char.stats.int;
            document.getElementById('char-stat-wis').innerText = char.stats.wis;
            document.getElementById('char-stat-luk').innerText = char.stats.luk;

            // Derived
            const derived = window.classSystem.calculateDerivedStats(char);
            document.getElementById('char-derived-hp').innerText = `${derived.maxHp}`;
            document.getElementById('char-derived-mp').innerText = `${derived.maxMp}`;
            document.getElementById('char-derived-patk').innerText = derived.patk;
            document.getElementById('char-derived-matk').innerText = derived.matk;
            document.getElementById('char-derived-def').innerText = derived.def;
            document.getElementById('char-derived-dodge').innerText = `${derived.dodge.toFixed(1)}%`;
            document.getElementById('char-derived-crit').innerText = `${derived.critRate.toFixed(1)}%`;
            document.getElementById('char-derived-cd').innerText = `${derived.cooldownRed.toFixed(1)}%`;

            const fatDisplay = document.getElementById('char-derived-fatigue');
            if (fatDisplay) {
                if (selectedId === 'player') {
                    const fatig = Math.round(char.fatigue !== undefined ? char.fatigue : 0);
                    fatDisplay.innerText = `${fatig} / 100`;
                    if (fatig > 75) {
                        fatDisplay.className = "glowing-text text-red-500 font-bold";
                    } else if (fatig > 40) {
                        fatDisplay.className = "glowing-text text-orange-500 font-bold";
                    } else {
                        fatDisplay.className = "glowing-text text-green-400 font-bold";
                    }
                } else {
                    fatDisplay.innerText = "N/A (Companion)";
                    fatDisplay.className = "glowing-text text-gray-500";
                }
            }

            const pointsNotify = document.getElementById('player-stat-points-notification');
            const strPlus = document.getElementById('player-stat-upgrade-str');
            const dexPlus = document.getElementById('player-stat-upgrade-dex');
            const vitPlus = document.getElementById('player-stat-upgrade-vit');
            const intPlus = document.getElementById('player-stat-upgrade-int');
            const wisPlus = document.getElementById('player-stat-upgrade-wis');
            const lukPlus = document.getElementById('player-stat-upgrade-luk');

            if (selectedId === 'player' && state.player.statPoints > 0) {
                pointsNotify.classList.remove('hidden');
                document.getElementById('player-available-stat-points').innerText = state.player.statPoints;
                [strPlus, dexPlus, vitPlus, intPlus, wisPlus, lukPlus].forEach(btn => btn.classList.remove('hidden'));
            } else {
                pointsNotify.classList.add('hidden');
                [strPlus, dexPlus, vitPlus, intPlus, wisPlus, lukPlus].forEach(btn => btn.classList.add('hidden'));
            }

            // Promotions Tree
            const promoContainer = document.getElementById('promotions-tree');
            promoContainer.innerHTML = '';
            
            const currentClassData = window.classSystem.classes[char.currentClass];
            if (currentClassData && currentClassData.promotions) {
                currentClassData.promotions.forEach(promoId => {
                    const promo = window.classSystem.classes[promoId];
                    const check = window.classSystem.canPromote(char, promoId);
                    
                    if (check.success) {
                        promoContainer.innerHTML += `
                            <div class="promotion-card">
                                <div>
                                    <h5>${promo.name}</h5>
                                    <p>${promo.desc}</p>
                                </div>
                                <button class="neon-btn violet-btn" style="padding: 6px 12px; font-size: 10px;" onclick="window.uiEngine.executePromotion('${selectedId}', '${promoId}')">PRZEBUDŹ (AWANS)</button>
                            </div>
                        `;
                    } else {
                        promoContainer.innerHTML += `
                            <div class="promotion-card" style="opacity: 0.6;">
                                <div>
                                    <h5>${promo.name} (Zablokowane)</h5>
                                    <p style="color: #ef5350;">${check.reason}</p>
                                </div>
                            </div>
                        `;
                    }
                });
            } else {
                promoContainer.innerHTML = '<p style="font-style: italic; font-size: 11px;">Postać osiągnęła już szczytową ewolucję klasową rangi Monarch!</p>';
            }

            // Render equipped slots (Paper Doll 22 Slots Grid)
            const silhouetteAvatar = document.getElementById('char-silhouette-avatar');

            if (silhouetteAvatar) {
                let avatarIcon = 'fa-user-secret';
                if (char.avatar === 'avatar_flame') avatarIcon = 'fa-fire';
                else if (char.avatar === 'avatar_shield') avatarIcon = 'fa-shield-cat';
                else if (char.avatar === 'avatar_hunter') avatarIcon = 'fa-crosshairs';
                
                if (selectedId === 'min_ah') avatarIcon = 'fa-wand-magic-sparkles';
                else if (selectedId === 'jin_soo') avatarIcon = 'fa-shield-halved';
                else if (selectedId === 'yu_na') avatarIcon = 'fa-kit-medical';

                silhouetteAvatar.innerHTML = `<i class="fa-solid ${avatarIcon}"></i>`;
            }

            const renderEqSlot = (slotEl, gearType, defaultIcon, defaultLabel) => {
                if (!slotEl) return;
                const gear = char.equippedGear ? char.equippedGear[gearType] : null;
                const isRing = gearType.startsWith('ring');
                // Clean rarity classes and dynamically append tooltip directions
                let extraClass = '';
                if (['shoulder_l', 'cape', 'glove_l', 'weapon_l'].includes(gearType)) {
                    extraClass = ' tooltip-right';
                } else if (['shoulder_r', 'belt', 'glove_r', 'weapon_r'].includes(gearType)) {
                    extraClass = ' tooltip-left';
                }
                slotEl.className = isRing ? ('eq-slot-ring tooltip-down' + extraClass) : ('eq-slot-sq tooltip-down' + extraClass);

                if (gear) {
                    slotEl.classList.remove('empty');
                    slotEl.classList.add(`rarity-${gear.rarity}`);
                    let iconClass = defaultIcon;
                    if (gear.type === 'weapon') iconClass = 'fa-sword';
                    else if (gear.type === 'shield') iconClass = 'fa-shield-halved';
                    else if (gear.type === 'ring') iconClass = 'fa-ring';
                    else if (gear.type === 'head') iconClass = 'fa-crown';
                    else if (gear.type === 'chest') iconClass = 'fa-shirt';
                    else if (gear.type === 'pants') iconClass = 'fa-socks';
                    else if (gear.type === 'boots') iconClass = 'fa-shoe-prints';
                    else if (gear.type === 'shoulder') iconClass = 'fa-user-shield';
                    else if (gear.type === 'glove') iconClass = 'fa-mitten';
                    else if (gear.type === 'belt') iconClass = 'fa-grip-lines';
                    else if (gear.type === 'cape') iconClass = 'fa-vest';

                    let rotation = (gear.type === 'weapon') ? 'style="transform: rotate(45deg);"' : '';
                    let scaleY = (gear.type === 'pants') ? 'style="transform: scaleY(-1);"' : '';
                    let style = rotation || scaleY || '';
                    slotEl.innerHTML = `<i class="fa-solid ${iconClass}" ${style}></i>`;

                    let tooltipText = `${gear.name} [${gear.rarity}]\nTyp: ${gear.type.toUpperCase()}\n`;
                    for (let s in gear.stats) { if (gear.stats[s] > 0) tooltipText += `+${gear.stats[s]} do ${s.toUpperCase()}\n`; }
                    for (let d in gear.derived) { if (gear.derived[d] > 0) tooltipText += `+${gear.derived[d]} do ${d.toUpperCase()}\n`; }
                    tooltipText += `\n[Kliknij, aby zdjąć przedmiot]`;
                    slotEl.setAttribute('data-tooltip', tooltipText);
                    slotEl.onclick = () => window.uiEngine.unequipGearItem(selectedId, gearType);
                } else {
                    slotEl.classList.add('empty');
                    let rotation = (defaultIcon === 'fa-sword') ? 'style="transform: rotate(45deg);"' : '';
                    let scaleY = (defaultIcon === 'fa-socks') ? 'style="transform: scaleY(-1);"' : '';
                    let style = rotation || scaleY || '';
                    slotEl.innerHTML = `<i class="fa-solid ${defaultIcon} placeholder-icon" ${style}></i>`;
                    slotEl.setAttribute('data-tooltip', `Slot: ${defaultLabel} [Pusty]\nWybierz pasujący przedmiot w plecaku i kliknij Załóż.`);
                    slotEl.onclick = null;
                }
            };

            const slotsToRender = [
                { id: 'eq-slot-head', type: 'head', icon: 'fa-crown', label: 'Głowa' },
                { id: 'eq-slot-shoulder_l', type: 'shoulder_l', icon: 'fa-user-shield', label: 'Naramiennik L' },
                { id: 'eq-slot-cape', type: 'cape', icon: 'fa-vest', label: 'Peleryna' },
                { id: 'eq-slot-chest', type: 'chest', icon: 'fa-shirt', label: 'Klata' },
                { id: 'eq-slot-belt', type: 'belt', icon: 'fa-grip-lines', label: 'Pas' },
                { id: 'eq-slot-pants', type: 'pants', icon: 'fa-socks', label: 'Spodnie' },
                { id: 'eq-slot-glove_l', type: 'glove_l', icon: 'fa-mitten', label: 'Rękawica L' },
                { id: 'eq-slot-boots', type: 'boots', icon: 'fa-shoe-prints', label: 'Buty' },
                { id: 'eq-slot-weapon_l', type: 'weapon_l', icon: 'fa-sword', label: 'Broń Lewa Dłoń' },
                { id: 'eq-slot-weapon_r', type: 'weapon_r', icon: 'fa-shield-halved', label: 'Prawa Dłoń (Broń/Tarcza)' },
                { id: 'eq-slot-shoulder_r', type: 'shoulder_r', icon: 'fa-user-shield', label: 'Naramiennik P' },
                { id: 'eq-slot-glove_r', type: 'glove_r', icon: 'fa-mitten', label: 'Rękawica P' },
                { id: 'eq-slot-ring_l1', type: 'ring_l1', icon: 'fa-ring', label: 'Pierścień Lewy 1' },
                { id: 'eq-slot-ring_l2', type: 'ring_l2', icon: 'fa-ring', label: 'Pierścień Lewy 2' },
                { id: 'eq-slot-ring_l3', type: 'ring_l3', icon: 'fa-ring', label: 'Pierścień Lewy 3' },
                { id: 'eq-slot-ring_l4', type: 'ring_l4', icon: 'fa-ring', label: 'Pierścień Lewy 4' },
                { id: 'eq-slot-ring_l5', type: 'ring_l5', icon: 'fa-ring', label: 'Pierścień Lewy 5' },
                { id: 'eq-slot-ring_r1', type: 'ring_r1', icon: 'fa-ring', label: 'Pierścień Prawy 1' },
                { id: 'eq-slot-ring_r2', type: 'ring_r2', icon: 'fa-ring', label: 'Pierścień Prawy 2' },
                { id: 'eq-slot-ring_r3', type: 'ring_r3', icon: 'fa-ring', label: 'Pierścień Prawy 3' },
                { id: 'eq-slot-ring_r4', type: 'ring_r4', icon: 'fa-ring', label: 'Pierścień Prawy 4' },
                { id: 'eq-slot-ring_r5', type: 'ring_r5', icon: 'fa-ring', label: 'Pierścień Prawy 5' }
            ];
            slotsToRender.forEach(slot => {
                const el = document.getElementById(slot.id);
                renderEqSlot(el, slot.type, slot.icon, slot.label);
            });

            this.renderInventory();
        }
    }

    renderInventory() {
        const state = window.gameState.state;
        const gearBag = document.getElementById('inventory-gear-bag');
        gearBag.innerHTML = '';
        const hpPots = state.inventory.hpPotions !== undefined ? state.inventory.hpPotions : 0;
        const mpPots = state.inventory.mpPotions !== undefined ? state.inventory.mpPotions : 0;
        const gearList = state.inventory.gear || [];
        const slotsUsed = gearList.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
        document.getElementById('backpack-slots-used').innerText = slotsUsed;
        const itemsToRender = [];
        gearList.forEach(gear => { itemsToRender.push({ type: 'gear', id: gear.id, gear: gear, isSel: this.selectedGearId === gear.id }); });
        if (hpPots > 0) itemsToRender.push({ type: 'potion_hp', id: 'potion_hp', count: hpPots, isSel: this.selectedGearId === 'potion_hp' });
        if (mpPots > 0) itemsToRender.push({ type: 'potion_mp', id: 'potion_mp', count: mpPots, isSel: this.selectedGearId === 'potion_mp' });
        
        if (state.inventory.crystalTiers) {
            Object.entries(state.inventory.crystalTiers).forEach(([rank, count]) => {
                if (count > 0) {
                    itemsToRender.push({ type: 'crystal', id: `crystal_${rank}`, rank: rank, count: count, isSel: this.selectedGearId === `crystal_${rank}` });
                }
            });
        }

        for (let i = 0; i < 20; i++) {
            const item = itemsToRender[i];
            const colIndex = i % 5; // Columns 0, 1, 2, 3, 4
            let tooltipAlign = '';
            if (colIndex < 2) tooltipAlign = ' tooltip-right';
            else if (colIndex > 2) tooltipAlign = ' tooltip-left';

            if (item) {
                if (item.type === 'gear') {
                    const gear = item.gear;
                    const isSel = item.isSel ? 'selected' : '';
                    let iconClass = 'fa-hammer';
                    if (gear.type === 'weapon') iconClass = 'fa-sword';
                    else if (gear.type === 'armor') iconClass = 'fa-shirt';
                    else if (gear.type === 'ring') iconClass = 'fa-ring';
                    let rotation = gear.type === 'weapon' ? 'style="transform: rotate(45deg);"' : '';
                    gearBag.innerHTML += `
                        <div class="backpack-slot rarity-${gear.rarity} ${isSel} tooltip-down${tooltipAlign}" 
                             data-tooltip="${gear.name} [${gear.rarity}]\nKliknij, aby zbadać rynsztunek."
                             onclick="window.uiEngine.selectGearItem('${gear.id}')">
                            <i class="fa-solid ${iconClass}" ${rotation}></i>
                        </div>`;
                } else if (item.type === 'potion_hp') {
                    const isSel = item.isSel ? 'selected' : '';
                    gearBag.innerHTML += `
                        <div class="backpack-slot ${isSel} tooltip-down${tooltipAlign}" 
                             data-tooltip="Eliksir Zdrowia (HP) x${item.count}\nPrzywraca 40% maks. HP wybranemu łowcy."
                             onclick="window.uiEngine.selectGearItem('potion_hp')">
                            <i class="fa-solid fa-flask" style="color: #ef5350;"></i>
                            <span class="stack-badge" style="color: #ef5350; border-color: rgba(239,83,80,0.25);">x${item.count}</span>
                        </div>`;
                } else if (item.type === 'potion_mp') {
                    const isSel = item.isSel ? 'selected' : '';
                    gearBag.innerHTML += `
                        <div class="backpack-slot ${isSel} tooltip-down${tooltipAlign}" 
                             data-tooltip="Eliksir Many (MP) x${item.count}\nPrzywraca 40% maks. MP wybranemu łowcy."
                             onclick="window.uiEngine.selectGearItem('potion_mp')">
                            <i class="fa-solid fa-flask" style="color: #42a5f5;"></i>
                            <span class="stack-badge" style="color: #42a5f5; border-color: rgba(66,165,245,0.25);">x${item.count}</span>
                        </div>`;
                } else if (item.type === 'crystal') {
                    const isSel = item.isSel ? 'selected' : '';
                    gearBag.innerHTML += `
                        <div class="backpack-slot ${isSel} tooltip-down${tooltipAlign}" 
                             data-tooltip="Kryształ Mana (${item.rank}) x${item.count}\nMożna spieniężyć w Stowarzyszeniu."
                             onclick="window.uiEngine.selectGearItem('crystal_${item.rank}')">
                            <i class="fa-solid fa-gem" style="color: #e040fb;"></i>
                            <span class="stack-badge" style="color: #e040fb; border-color: rgba(224,64,251,0.25);">x${item.count}</span>
                        </div>`;
                }
            } else {
                gearBag.innerHTML += `<div class="backpack-slot empty"></div>`;
            }
        }

        const detailsPanel = document.getElementById('gear-item-details');
        if (this.selectedGearId) {
            if (this.selectedGearId === 'potion_hp') {
                detailsPanel.classList.remove('hidden');
                const nameDisplay = document.getElementById('gear-name-display');
                nameDisplay.innerText = `Eliksir Uzdrawiający (HP) x${hpPots}`;
                nameDisplay.className = `glowing-text`;
                nameDisplay.style.color = '#ef5350';
                document.getElementById('gear-stats-display').innerHTML = `Typ: UŻYTKOWY FLAKON<br>Przywraca 40% HP.<br><div style="margin-top: 10px;"><button class="neon-btn cyan-btn" onclick="window.uiEngine.usePotion('hp')">UŻYJ MIKSTURY</button></div>`;
            } else if (this.selectedGearId === 'potion_mp') {
                detailsPanel.classList.remove('hidden');
                const nameDisplay = document.getElementById('gear-name-display');
                nameDisplay.innerText = `Eliksir Regeneracji Many (MP) x${mpPots}`;
                nameDisplay.className = `glowing-text`;
                nameDisplay.style.color = '#42a5f5';
                document.getElementById('gear-stats-display').innerHTML = `Typ: UŻYTKOWY FLAKON<br>Przywraca 40% MP.<br><div style="margin-top: 10px;"><button class="neon-btn cyan-btn" onclick="window.uiEngine.usePotion('mp')">UŻYJ MIKSTURY</button></div>`;
            } else if (this.selectedGearId.startsWith('crystal_')) {
                detailsPanel.classList.remove('hidden');
                const rank = this.selectedGearId.split('_')[1];
                const count = state.inventory.crystalTiers[rank];

                const nameDisplay = document.getElementById('gear-name-display');
                nameDisplay.innerText = `Kryształ Mana (${rank}) x${count}`;
                nameDisplay.className = `glowing-text`;
                nameDisplay.style.color = '#e040fb';

                const sellValue = count * 10;

                document.getElementById('gear-stats-display').innerHTML = `Typ: WALUTA<br>Wartość: ${sellValue} Złota w Stowarzyszeniu.<br><div style="margin-top: 10px;"><button class="neon-btn violet-btn" onclick="window.uiEngine.sellAllCrystals('${rank}')">SPRZEDAJ WSZYSTKIE (${rank})</button></div>`;
            } else {
                const gear = state.inventory.gear.find(g => g.id === this.selectedGearId);
                if (gear) {
                    detailsPanel.classList.remove('hidden');
                    const nameDisplay = document.getElementById('gear-name-display');
                    nameDisplay.innerText = `${gear.name} [${gear.rarity}]`;
                    nameDisplay.className = `glowing-text rarity-${gear.rarity}`;
                    nameDisplay.style.color = '';
                    let statsText = `Typ: ${gear.type.toUpperCase()}<br>`;
                    for (let s in gear.stats) { if (gear.stats[s] > 0) statsText += `+${gear.stats[s]} do ${s.toUpperCase()}<br>`; }
                    const sellValue = gear.rarity === 'Pomarańczowy' ? 2000 : (gear.rarity === 'Fioletowy' ? 600 : (gear.rarity === 'Niebieski' ? 250 : (gear.rarity === 'Zielony' ? 100 : 50)));
                    statsText += `<div style="margin-top: 10px; display: flex; gap: 8px;"><button class="neon-btn cyan-btn" onclick="window.uiEngine.equipGearItem('${gear.id}')">ZAŁÓŻ</button><button class="neon-btn violet-btn" onclick="window.uiEngine.sellGearItem('${gear.id}', ${sellValue})">SPRZEDAJ (${sellValue}G)</button></div>`;
                    document.getElementById('gear-stats-display').innerHTML = statsText;
                } else detailsPanel.classList.add('hidden');
            }
        } else detailsPanel.classList.add('hidden');
    }

    selectGearItem(gearId) {
        this.selectedGearId = this.selectedGearId === gearId ? null : gearId;
        this.renderInventory();
    }

    equipGearItem(gearId) {
        const state = window.gameState.state;
        const gearIndex = state.inventory.gear.findIndex(g => g.id === gearId);
        if (gearIndex === -1) return;
        const gear = state.inventory.gear[gearIndex];
        const selectedId = this.selectedCompanionId;
        const char = selectedId === 'player' ? state.player : state.companions[selectedId];
        if (char) {
            // Ensure all 22 slots are initialized safely
            if (!char.equippedGear) char.equippedGear = {};
            const slots = ['head', 'chest', 'pants', 'boots', 'shoulder_l', 'shoulder_r', 'glove_l', 'glove_r', 'belt', 'cape', 'ring_l1', 'ring_l2', 'ring_l3', 'ring_l4', 'ring_l5', 'ring_r1', 'ring_r2', 'ring_r3', 'ring_r4', 'ring_r5', 'weapon_l', 'weapon_r'];
            slots.forEach(s => {
                if (char.equippedGear[s] === undefined) char.equippedGear[s] = null;
            });

            // Map gear type to paper doll slots
            let targetSlot = null;
            if (gear.type === 'head') targetSlot = 'head';
            else if (gear.type === 'chest' || gear.type === 'armor') targetSlot = 'chest';
            else if (gear.type === 'pants') targetSlot = 'pants';
            else if (gear.type === 'boots') targetSlot = 'boots';
            else if (gear.type === 'belt') targetSlot = 'belt';
            else if (gear.type === 'cape') targetSlot = 'cape';
            else if (gear.type === 'shield') targetSlot = 'weapon_r';
            else if (gear.type === 'weapon') {
                if (!char.equippedGear.weapon_l) targetSlot = 'weapon_l';
                else if (!char.equippedGear.weapon_r) targetSlot = 'weapon_r';
                else targetSlot = 'weapon_l';
            } else if (gear.type === 'shoulder') {
                if (!char.equippedGear.shoulder_l) targetSlot = 'shoulder_l';
                else if (!char.equippedGear.shoulder_r) targetSlot = 'shoulder_r';
                else targetSlot = 'shoulder_l';
            } else if (gear.type === 'glove') {
                if (!char.equippedGear.glove_l) targetSlot = 'glove_l';
                else if (!char.equippedGear.glove_r) targetSlot = 'glove_r';
                else targetSlot = 'glove_l';
            } else if (gear.type === 'ring') {
                const ringSlots = [
                    'ring_l1', 'ring_l2', 'ring_l3', 'ring_l4', 'ring_l5',
                    'ring_r1', 'ring_r2', 'ring_r3', 'ring_r4', 'ring_r5'
                ];
                const emptySlot = ringSlots.find(slot => !char.equippedGear[slot]);
                targetSlot = emptySlot || 'ring_l1';
            }

            if (!targetSlot) {
                alert('Nieznany typ przedmiotu!');
                return;
            }

            const previousGear = char.equippedGear[targetSlot];
            if (previousGear) {
                for (let s in previousGear.stats) { if (previousGear.stats[s] > 0) char.stats[s] -= previousGear.stats[s]; }
                state.inventory.gear.push(previousGear);
            }
            
            char.equippedGear[targetSlot] = gear;
            for (let s in gear.stats) { if (gear.stats[s] > 0) char.stats[s] += gear.stats[s]; }
            state.inventory.gear.splice(gearIndex, 1);
            
            this.selectedGearId = null;
            window.gameState.save();
            this.renderPartyTab();
            this.updateHUD();
            alert(`Pomyślnie założono przedmiot: ${gear.name}!`);
        }
    }

    unequipGearItem(charId, gearType) {
        const state = window.gameState.state;
        const char = charId === 'player' ? state.player : state.companions[charId];
        if (!char || !char.equippedGear || !char.equippedGear[gearType]) return;
        const gear = char.equippedGear[gearType];
        const hpPots = state.inventory.hpPotions !== undefined ? state.inventory.hpPotions : 0;
        const mpPots = state.inventory.mpPotions !== undefined ? state.inventory.mpPotions : 0;
        const slotsUsed = state.inventory.gear.length + (hpPots > 0 ? 1 : 0) + (mpPots > 0 ? 1 : 0);
        if (slotsUsed >= 20) { alert('Twój plecak jest pełen!'); return; }
        for (let s in gear.stats) { if (gear.stats[s] > 0) char.stats[s] -= gear.stats[s]; }
        char.equippedGear[gearType] = null;
        state.inventory.gear.push(gear);
        window.gameState.save();
        this.renderPartyTab();
        this.updateHUD();
        alert(`Zdjęto przedmiot: ${gear.name}.`);
    }

    usePotion(type) {
        const state = window.gameState.state;
        const selectedId = this.selectedCompanionId;
        const char = selectedId === 'player' ? state.player : state.companions[selectedId];
        if (!char) return;
        if (type === 'hp') {
            if ((state.inventory.hpPotions || 0) <= 0) { alert("Brak mikstur HP!"); return; }
            const derived = window.classSystem.calculateDerivedStats(char);
            char.hp = Math.min(derived.maxHp, (char.hp || derived.maxHp) + Math.floor(derived.maxHp * 0.40));
            state.inventory.hpPotions--;
        } else {
            if ((state.inventory.mpPotions || 0) <= 0) { alert("Brak mikstur MP!"); return; }
            const derived = window.classSystem.calculateDerivedStats(char);
            char.mp = Math.min(derived.maxMp, (char.mp || derived.maxMp) + Math.floor(derived.maxMp * 0.40));
            state.inventory.mpPotions--;
        }
        window.gameState.save();
        this.renderPartyTab();
        this.updateHUD();
        alert("Mikstura użyta pomyślnie.");
    }

    sellGearItem(gearId, value) {
        const state = window.gameState.state;
        const gearIndex = state.inventory.gear.findIndex(g => g.id === gearId);
        if (gearIndex === -1) return;
        state.inventory.gear.splice(gearIndex, 1);
        state.inventory.gold += value;
        this.selectedGearId = null;
        window.gameState.save();
        this.renderPartyTab();
        this.updateHUD();
        alert(`Sprzedano przedmiot za +${value} Złota!`);
    }

    sellAllCrystals(rank) {
        const state = window.gameState.state;
        const count = state.inventory.crystalTiers[rank];
        if (count > 0) {
            state.inventory.crystalTiers[rank] = 0;
            state.inventory.manaCrystals -= count; // Keep total in sync
            state.inventory.gold += count * 10;
            this.selectedGearId = null;
            window.gameState.save();
            this.renderInventory();
            this.updateHUD();
            alert(`Sprzedano wszystkie kryształy (${rank}) za +${count * 10} Złota!`);
        }
    }

    equipCompanionToParty(companionId) {
        const state = window.gameState.state;
        if (state.party.includes(companionId)) return;

        if (state.party.length >= 4) {
            const playerIndex = state.party.indexOf('player');
            let companionIndex = -1;
            
            for (let i = 0; i < state.party.length; i++) {
                if (state.party[i] !== 'player') {
                    companionIndex = i;
                    break;
                }
            }

            if (companionIndex !== -1) {
                state.party[companionIndex] = companionId;
            }
        } else {
            state.party.push(companionId);
        }

        window.gameState.save();
        this.renderPartyTab();
    }

    upgradePlayerStat(stat) {
        const state = window.gameState.state;
        if (state.player.statPoints > 0) {
            state.player.statPoints--;
            state.player.stats[stat]++;
            window.gameState.save();
            this.renderPartyTab();
            this.updateHUD();
        }
    }

    executePromotion(charId, classId) {
        const report = window.classSystem.promoteCharacter(charId, classId);
        if (report.success) {
            this.showSystemAlert(`[PRZEBUDZENIE KLASY]\nPostać zmieniła ścieżkę klasową na: ${report.className}!\n${report.desc}`);
            this.renderPartyTab();
            this.updateHUD();
        } else {
            alert(report.reason);
        }
    }

    /**
     * WIDOK 3: MATRIX & FUSION RENDEROWANIE
     */
    renderSkillsTab() {
        const state = window.gameState.state;
        const container = document.getElementById('owned-skills-container');
        container.innerHTML = '';

        state.player.skills.forEach(skillState => {
            const skill = window.skillsSystem.skills[skillState.id];
            if (!skill) return;

            const isSel = (this.fusionSlotA === skillState.id || this.fusionSlotB === skillState.id) ? 'selected-for-fusion' : '';

            container.innerHTML += `
                <div class="skill-card ${isSel}" onclick="window.uiEngine.selectSkillForFusion('${skillState.id}')">
                    <div class="name-lvl">
                        <h4>${skill.name}</h4>
                        <span class="badge">Lvl ${skillState.level}/10</span>
                    </div>
                    <p class="desc">${skill.desc}</p>
                </div>
            `;
        });

        const slotA = document.getElementById('fusion-slot-a');
        const slotB = document.getElementById('fusion-slot-b');

        if (this.fusionSlotA) {
            const skill = window.skillsSystem.skills[this.fusionSlotA];
            slotA.innerHTML = `<strong>${skill.name}</strong><br><span style="font-size: 8px;">KLIKNIJ BY USUNĄĆ</span>`;
            slotA.className = 'fusion-slot active glass-panel cursor-pointer';
        } else {
            slotA.innerHTML = '<span class="placeholder">Dodaj skill A (Lvl 10)</span>';
            slotA.className = 'fusion-slot glass-panel cursor-pointer';
        }

        if (this.fusionSlotB) {
            const skill = window.skillsSystem.skills[this.fusionSlotB];
            slotB.innerHTML = `<strong>${skill.name}</strong><br><span style="font-size: 8px;">KLIKNIJ BY USUNĄĆ</span>`;
            slotB.className = 'fusion-slot active glass-panel cursor-pointer';
        } else {
            slotB.innerHTML = '<span class="placeholder">Dodaj skill B (Lvl 10)</span>';
            slotB.className = 'fusion-slot glass-panel cursor-pointer';
        }
    }

    selectSkillForFusion(skillId) {
        if (!this.fusionSlotA && this.fusionSlotB !== skillId) {
            this.fusionSlotA = skillId;
        } else if (!this.fusionSlotB && this.fusionSlotA !== skillId) {
            this.fusionSlotB = skillId;
        } else if (this.fusionSlotA === skillId) {
            this.fusionSlotA = null;
        } else if (this.fusionSlotB === skillId) {
            this.fusionSlotB = null;
        }
        this.renderSkillsTab();
    }

    removeFusionSlot(slot) {
        if (slot === 'A') this.fusionSlotA = null;
        if (slot === 'B') this.fusionSlotB = null;
        this.renderSkillsTab();
    }

    triggerSkillFusion() {
        if (!this.fusionSlotA || !this.fusionSlotB) {
            alert('Wybierz dwie w pełni rozwinięte umiejętności w slotach Matrixa.');
            return;
        }

        const report = window.skillsSystem.fuseSkills(window.gameState.state.player, this.fusionSlotA, this.fusionSlotB);
        if (report.success) {
            this.fusionSlotA = null;
            this.fusionSlotB = null;
            this.showSystemAlert(`[ZAKOŃCZONO FUZJĘ SYSTEMU]\nGratulacje! Zyskałeś nową unikalną umiejętność: ${report.resultName}!\n${report.desc}`);
            this.renderSkillsTab();
            this.updateHUD();
        } else {
            alert(report.reason);
        }
    }

    /**
     * WIDOK 4: BRAMY I COMBAT ENGINE RENDEROWANIE
     */
    /**
     * WIDOK 4: BRAMY I COMBAT ENGINE RENDEROWANIE
     */
    renderGatesTab() {
        const state = window.gameState.state;
        const container = document.getElementById('gates-list-container');
        if (!container) return;
        container.innerHTML = '';

        // Combine static Gates and Dynamic Gates
        const allGates = [];
        
        // Add static unlocked gates
        for (let gateId in window.dungeonsSystem.gates) {
            const gate = window.dungeonsSystem.gates[gateId];
            allGates.push({
                id: gateId,
                name: gate.name,
                rank: gate.rank,
                waves: gate.waves,
                recommendedLvl: gate.recommendedLvl,
                mobTemplate: gate.mobTemplate,
                boss: gate.boss,
                isUnlocked: state.world.unlockedGates.includes(gateId),
                isDynamic: false
            });
        }

        // Add dynamically spawned active gates
        if (state.world.dynamicGates) {
            state.world.dynamicGates.forEach(g => {
                allGates.push({
                    id: g.id,
                    name: g.name,
                    rank: g.rank,
                    waves: g.waves,
                    recommendedLvl: g.recommendedLvl,
                    mobTemplate: g.mobTemplate,
                    boss: g.boss,
                    isUnlocked: true, // Dynamic gates are always visible when spawned
                    isDynamic: true,
                    dynamicType: g.dynamicType
                });
            });
        }

        // Sort: Active gate first, then unlocked, then rank sequence (S, A, B, C, D, E)
        const rankValue = { 'S': 6, 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
        allGates.sort((a, b) => {
            const aActive = state.world.currentGate === a.id ? 1 : 0;
            const bActive = state.world.currentGate === b.id ? 1 : 0;
            if (aActive !== bActive) return bActive - aActive;

            if (a.isUnlocked !== b.isUnlocked) return b.isUnlocked ? 1 : -1;

            return rankValue[b.rank] - rankValue[a.rank];
        });

        allGates.forEach(gate => {
            const gateId = gate.id;
            const isUnlocked = gate.isUnlocked;
            const isActive = state.world.currentGate === gateId ? 'active-run' : '';
            const isReserved = state.world.reservedGates[gateId] ? true : false;
            
            // Build visual metadata
            let typeBadge = "Standardowa";
            let colorAccent = "var(--violet-neon)";
            if (gate.isDynamic) {
                if (gate.dynamicType === 'red_gate') {
                    typeBadge = "Czerwona Brama";
                    colorAccent = "#ff3333";
                } else if (gate.dynamicType === 'dungeon_break') {
                    typeBadge = "Przełom Lochu";
                    colorAccent = "#ff9100";
                }
            }

            if (isUnlocked) {
                const tooltipText = `Brama: ${gate.name} (Ranga ${gate.rank})&#10;Styl: ${typeBadge}&#10;Sektory do przejścia: ${gate.waves}&#10;Zwykli wrogowie: ${gate.mobTemplate.name} (HP: ${gate.mobTemplate.hp}, ATK: ${gate.mobTemplate.patk})&#10;Boss główny: ${gate.boss.name} (HP: ${gate.boss.hp}, ATK: ${gate.boss.patk})&#10;Płać licencję u wejścia, by zarezerwować.`;
                
                // Show license status label on the card
                let licenseLabel = "";
                if (gate.dynamicType === 'dungeon_break') {
                    licenseLabel = `<span style="color: #4caf50; font-size: 10px; font-weight: bold; background: rgba(76,175,80,0.15); padding: 2px 6px; border-radius: 3px;">Darmowy Przełom</span>`;
                } else if (isReserved) {
                    licenseLabel = `<span style="color: #4caf50; font-size: 10px; font-weight: bold; background: rgba(76,175,80,0.15); padding: 2px 6px; border-radius: 3px;">Zarezerwowana</span>`;
                } else {
                    licenseLabel = `<span style="color: #ff3333; font-size: 10px; font-weight: bold; background: rgba(255,51,51,0.12); padding: 2px 6px; border-radius: 3px;">Wymaga Licencji</span>`;
                }

                container.innerHTML += `
                    <div class="gate-card ${isActive}" data-tooltip="${tooltipText}">
                        <div class="header-gate">
                            <h4 style="color: ${gate.dynamicType === 'red_gate' ? '#ff3333' : '#fff'}">${gate.name}</h4>
                            <span class="rank rank-${gate.rank}">${gate.rank}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                            <span class="badge" style="background: ${colorAccent}; margin: 0; font-size: 8px;">${typeBadge}</span>
                            ${licenseLabel}
                        </div>
                        <div class="rec-lvl">Zalecany Poziom: Lvl ${gate.recommendedLvl}</div>
                        
                        ${state.world.currentGate === gateId ? 
                            `<button class="neon-btn violet-btn" style="background: rgba(139,0,255,0.4);" disabled>AKTYWNY RAJD...</button>` :
                            `<button class="neon-btn cyan-btn" onclick="window.uiEngine.openRaidPrep('${gateId}')">PRZYGOTUJ SIĘ</button>`
                        }
                    </div>
                `;
            } else {
                const tooltipText = `Brama Nieznana / Zablokowana&#10;Odblokuj wyższe rangi bram poprzez reputację, zadania fabularne lub plotki w mieście.&#10;Przeciwnicy: ????&#10;Boss: ????&#10;Fale: ????&#10;Szansa na drop: ????`;
                
                container.innerHTML += `
                    <div class="gate-card locked-gate" data-tooltip="${tooltipText}" style="opacity: 0.65; background: rgba(0,0,0,0.15);">
                        <div class="header-gate">
                            <h4 style="color: var(--text-muted);"><i class="fa-solid fa-lock" style="margin-right: 6px; font-size: 11px;"></i>Nieznana Brama (${gate.rank}-Rank)</h4>
                            <span class="rank rank-${gate.rank}" style="opacity: 0.5; filter: grayscale(1);">${gate.rank}</span>
                        </div>
                        <div class="rec-lvl" style="color: var(--text-muted);">Wymagany Poziom: Lvl ??</div>
                        <button class="neon-btn violet-btn" style="border-color: #f44336; color: #f44336; background: rgba(244,67,54,0.05); padding: 8px;" disabled>
                            <i class="fa-solid fa-lock"></i> ZABLOKOWANA
                        </button>
                    </div>
                `;
            }
        });

        const emptyMsg = document.getElementById('empty-battle-message');
        const activeView = document.getElementById('active-battle-view');

        if (state.world.currentGate) {
            emptyMsg.classList.add('hidden');
            activeView.classList.remove('hidden');

            let gate = window.dungeonsSystem.gates[state.world.currentGate];
            if (!gate && state.world.dynamicGates) {
                gate = state.world.dynamicGates.find(g => g.id === state.world.currentGate);
            }
            const system = window.dungeonsSystem;
            
            // Render gate name and include Red Gate / Double Dungeon prefix indicators
            let typePrefix = "";
            let typeColor = "#00f3ff"; // default cyan
            if (system.gateType === 'red_gate') {
                typePrefix = "🔴 [Czerwona Brama] ";
                typeColor = "#ff3333";
            } else if (system.gateType === 'double_dungeon') {
                typePrefix = "👁️ [Podwójny Loch] ";
                typeColor = "#d500f9";
            } else if (system.gateType === 'dungeon_break') {
                typePrefix = "🚨 [Przełom Lochu] ";
                typeColor = "#ff9100";
            }
            
            const gateNameEl = document.getElementById('battle-gate-name');
            if (gateNameEl && gate) {
                gateNameEl.style.color = typeColor;
                gateNameEl.innerText = typePrefix + gate.name;
            }

            const currentSectorName = system.sectors[system.currentWave - 1] || "Głęboki Sektor";
            document.getElementById('battle-wave-text').innerText = `Sekcja ${system.currentWave}/${system.totalWaves} - "${currentSectorName}"`;

            // Allies mobs
            const alliesBox = document.getElementById('battle-party-mobs');
            alliesBox.innerHTML = '';
            window.dungeonsSystem.activeParty.forEach(ally => {
                const hpPercent = (ally.hp / ally.maxHp) * 100;
                const mpPercent = (ally.mp / ally.maxMp) * 100;
                const apPercent = Math.min(100, ally.actionGauge || 0);

                alliesBox.innerHTML += `
                    <div class="battle-mob-card">
                        <div class="mob-name">
                            <span>${ally.name}</span>
                            <span>Lvl ${ally.level}</span>
                        </div>
                        <div class="battle-hp-bar" data-tooltip="Zdrowie bohatera">
                            <div class="battle-hp-fill" style="width: ${hpPercent}%;"></div>
                        </div>
                        <div class="battle-mp-bar" data-tooltip="Mana bohatera">
                            <div class="battle-mp-fill" style="width: ${mpPercent}%;"></div>
                        </div>
                        <div class="battle-ap-bar" data-tooltip="Pasek akcji: gotowość do następnego ataku">
                            <div class="battle-ap-fill" style="width: ${apPercent}%;"></div>
                        </div>
                        <div style="font-size: 8px; display: flex; justify-content: space-between; color: var(--text-muted); margin-top: 2px;">
                            <span>Gotowość: ${apPercent.toFixed(0)}%</span>
                            <span>HP: ${ally.hp}/${ally.maxHp} | MP: ${ally.mp}/${ally.maxMp}</span>
                        </div>
                    </div>
                `;
            });

            // Enemy mobs
            const enemiesBox = document.getElementById('battle-monsters-mobs');
            enemiesBox.innerHTML = '';
            window.dungeonsSystem.monsters.forEach(monster => {
                const hpPercent = (monster.hp / monster.maxHp) * 100;
                const apPercent = Math.min(100, monster.actionGauge || 0);
                const monsterSpeed = window.dungeonsSystem.getMonsterSpeed(monster);

                enemiesBox.innerHTML += `
                    <div class="battle-mob-card">
                        <div class="mob-name">
                            <span>${monster.name}</span>
                            <span style="color: #e53935;">HP: ${monster.hp}/${monster.maxHp}</span>
                        </div>
                        <div class="battle-hp-bar" data-tooltip="Zdrowie potwora">
                            <div class="battle-hp-fill" style="width: ${hpPercent}%;"></div>
                        </div>
                        <div class="battle-ap-bar" data-tooltip="Pasek akcji wroga">
                            <div class="battle-ap-fill" style="width: ${apPercent}%;"></div>
                        </div>
                        <div style="font-size: 8px; display: flex; justify-content: space-between; color: var(--text-muted); margin-top: 2px;">
                            <span>Naładowanie: ${apPercent.toFixed(0)}%</span>
                            <span>Szybkość: +${monsterSpeed} /s</span>
                        </div>
                    </div>
                `;
            });

            const logsScroller = document.getElementById('combat-logs-container');
            logsScroller.innerHTML = '';
            [...window.dungeonsSystem.battleLog].reverse().forEach(line => {
                logsScroller.innerHTML += `<p>${line}</p>`;
            });

            logsScroller.scrollTop = 0;

        } else {
            emptyMsg.classList.remove('hidden');
            activeView.classList.add('hidden');
        }
    }

    /**
     * OPENS THE DETAILED RAID BRIEFING / PREPARATION DIALOG
     */
    openRaidPrep(gateId) {
        this.selectedPrepGateId = gateId;
        const state = window.gameState.state;
        
        let gate = window.dungeonsSystem.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        if (!gate) return;

        // Visual properties
        let typeText = "Standardowa";
        let badgeBg = "var(--violet-neon)";
        let textDesc = "Wysoce niestabilne skupisko potworów. Aby wejść do środka, Stowarzyszenie wymaga oficjalnej licencji i autoryzacji ubezpieczeniowej.";
        
        if (gate.isDynamic) {
            if (gate.dynamicType === 'red_gate') {
                typeText = "Czerwona Brama";
                badgeBg = "#ff3333";
                textDesc = "Ekstremalnie niebezpieczna szczelina o podwyższonej gęstości magicznej. Nieopatrznemu wejściu towarzyszy ryzyko mutacji bossów.";
            } else if (gate.dynamicType === 'dungeon_break') {
                typeText = "Przełom Lochu";
                badgeBg = "#ff9100";
                textDesc = "Mankament integralności portalu! Stowarzyszenie w pełni sponsoruje wyprawę w celu ratowania miasta. Brak opłat licencyjnych.";
            }
        }

        // Set text properties
        document.getElementById('prep-gate-name').innerText = gate.name;
        document.getElementById('prep-gate-type-badge').innerText = typeText;
        document.getElementById('prep-gate-type-badge').style.background = badgeBg;
        document.getElementById('prep-gate-desc').innerText = textDesc;

        // Briefing values
        const rankEl = document.getElementById('prep-gate-rank');
        rankEl.innerText = gate.rank;
        rankEl.className = `rank rank-${gate.rank}`;

        document.getElementById('prep-rec-lvl').innerText = `Lvl ${gate.recommendedLvl}`;
        document.getElementById('prep-player-lvl').innerText = `Lvl ${state.player.level}`;

        const activePartyCount = state.party ? state.party.length : 1;
        document.getElementById('prep-party-count').innerText = `${activePartyCount} łowców (Drużyna)`;

        // Predict death danger percentage
        const deathRatio = window.dungeonsSystem.calculateDeathProbability(gateId);
        const deathTextEl = document.getElementById('prep-death-probability');
        deathTextEl.innerText = `${deathRatio}%`;

        const deathBar = document.getElementById('prep-death-bar-fill');
        deathBar.style.width = `${deathRatio}%`;

        let verdict = "Bezpieczne warunki. Poziom przygotowania Twoich łowców gwarantuje pełne panowanie nad hordą.";
        if (deathRatio > 80) {
            verdict = "🚨 SAMOBÓJSTWO! Twoi łowcy nie przeżyją nawet pierwszej minuty! Wytrwale trenuj lub zwerbuj najemników przed wejściem!";
            deathTextEl.style.color = "#ff1111";
        } else if (deathRatio > 55) {
            verdict = "⚠️ BARDZO WYSOKIE RYZYKO! Przeciwnicy drastycznie przewyższają Cię obroną i siłą. Prawdopodobieństwo śmierci jest zatrważające.";
            deathTextEl.style.color = "#ff3333";
        } else if (deathRatio > 35) {
            verdict = "Umiarkowane niebezpieczeństwo. Przeciwnik może okazać się wyzwaniem. Zaopatrz się w mikstury leczące.";
            deathTextEl.style.color = "gold";
        } else if (deathRatio > 15) {
            verdict = "Niskie niebezpieczeństwo. Twoja przewaga poziomowa minimalizuje błędy.";
            deathTextEl.style.color = "#4caf50";
        } else {
            deathTextEl.style.color = "#4caf50";
        }
        document.getElementById('prep-death-verdict').innerText = verdict;

        // License fee costs
        const rankCosts = { 'E': 120, 'D': 450, 'C': 1600, 'B': 4200, 'A': 12500, 'S': 38000 };
        const licenseCost = gate.dynamicType === 'dungeon_break' ? 0 : (rankCosts[gate.rank] || 100);
        document.getElementById('prep-license-cost').innerText = `${licenseCost} Złota`;

        // Check paid status
        const isReserved = state.world.reservedGates && state.world.reservedGates[gateId];
        const isFree = gate.dynamicType === 'dungeon_break';
        const licenseStatusEl = document.getElementById('prep-license-status');
        const buyBtn = document.getElementById('prep-buy-license-btn');
        const enterBtn = document.getElementById('prep-enter-btn');
        const joinBtn = document.getElementById('prep-join-group-btn');

        if (isReserved || isFree) {
            licenseStatusEl.innerText = isFree ? "SPONSOROWANE (0 ZŁOTA)" : "OPŁACONA / ZAREZERWOWANA";
            licenseStatusEl.style.color = "#4caf50";
            buyBtn.style.display = 'none';
            if (joinBtn) joinBtn.style.display = 'none';
            enterBtn.disabled = false;
        } else {
            licenseStatusEl.innerText = "NIEOPŁACONA - WYMAGANY ZAKUP";
            licenseStatusEl.style.color = "#ff3333";
            buyBtn.style.display = 'block';
            if (joinBtn) joinBtn.style.display = 'block';
            enterBtn.disabled = true;
        }

        // Display panel
        document.getElementById('raid-prep-modal').classList.remove('hidden');
    }

    /**
     * CLOSES BRIEFING MODAL
     */
    closeRaidPrep() {
        document.getElementById('raid-prep-modal').classList.add('hidden');
        this.selectedPrepGateId = null;
    }

    /**
     * ATTEMPTS TO PURCHASE A RAID ACCESS LICENSE FOR GOLD
     */
    executeBuyLicense() {
        const state = window.gameState.state;
        const gateId = this.selectedPrepGateId;
        if (!gateId) return;

        let gate = window.dungeonsSystem.gates[gateId];
        if (!gate && state.world.dynamicGates) {
            gate = state.world.dynamicGates.find(g => g.id === gateId);
        }
        if (!gate) return;

        const rankCosts = { 'E': 120, 'D': 450, 'C': 1600, 'B': 4200, 'A': 12500, 'S': 38000 };
        const cost = gate.dynamicType === 'dungeon_break' ? 0 : (rankCosts[gate.rank] || 100);

        if (state.player.gold < cost) {
            alert('Niewystarczająca ilość złota! Stowarzyszenie nie wyda licencji bez pełnej kaucji.');
            return;
        }

        window.gameState.spendGold(cost);
        if (!state.world.reservedGates) {
            state.world.reservedGates = {};
        }
        state.world.reservedGates[gateId] = true;
        window.gameState.save();

        this.showSystemAlert(`[ZAKUPIONO LICENCJĘ RAJDU]\nZarejestrowano pomyślnie rezerwację Bramy "${gate.name}" w rejestrze Stowarzyszenia. Pobrano opłatę w wysokości ${cost} złota.`);
        
        // Refresh prep screen layout
        this.openRaidPrep(gateId);
        this.renderGatesTab();
        this.updateHUD();
    }

    /**
     * ENTERS THE DUNGEON (POINT OF NO RETURN)
     */
    executeEnterGate(asGuestMercenary = false) {
        const gateId = this.selectedPrepGateId;
        if (!gateId) return;

        // Set the flag in dungeonsSystem before starting!
        window.dungeonsSystem.isGuestMercenaryRaid = !!asGuestMercenary;

        const check = window.dungeonsSystem.startGate(gateId);
        if (check) {
            const state = window.gameState.state;
            state.world.currentGate = gateId;
            window.gameState.save();

            this.closeRaidPrep();
            this.switchTab('combat');
            this.renderGatesTab();
            
            if (asGuestMercenary) {
                this.showSystemAlert(`[KONTRAKT NAJEMNIKA PODPISANY]\nDołączasz do grupy uderzeniowej jako wolny strzelec. Stowarzyszenie ubezpiecza wyprawę, lecz lider dzieli łupy według wkładu. Otrzymasz gwarantowany stały żołd za oczyszczenie bossa! Brak możliwości odwrotu...`);
            } else {
                this.showSystemAlert(`[PRZEKROCZENIE HORYZONTU WRÓT]\nPrzekraczasz błonę portalu. Czujesz mrożący krew w klatce pradawny powiew. Brak możliwości odwrotu do chwili oczyszczenia bossa lub ratunkowej ewakuacji...`);
            }
            this.updateHUD();
        } else {
            // Clean up if start failed
            window.dungeonsSystem.isGuestMercenaryRaid = false;
        }
    }

    /**
     * DISPLAY ESCAPE MODAL AT CRITICAL HEALTH STATUS
     */
    showEscapeModal() {
        document.getElementById('escape-prompt-modal').classList.remove('hidden');
    }

    /**
     * PERFORMS ESCAPE BACKUP TIME-ROLLBACK
     */
    executeEscapeDungeon() {
        const backupData = localStorage.getItem(window.gameState.SAVE_KEY + "_dungeon_backup");
        if (backupData) {
            window.gameState.state = JSON.parse(backupData);
            window.gameState.save();
            console.log("[SYSTEM] Ucieczka udana: nastąpiło cofnięcie zmian ze stabilnego punktu przywracania.");
        }

        document.getElementById('escape-prompt-modal').classList.add('hidden');
        window.dungeonsSystem.battleActive = false;
        window.dungeonsSystem.isPaused = false;
        window.dungeonsSystem.escapePromptTriggered = false;
        window.dungeonsSystem.isGuestMercenaryRaid = false;

        this.switchTab('city');
        this.renderGatesTab();
        this.updateHUD();
        
        this.showSystemAlert(`[EWANUACJA POMYŚLNA]\nUżyłeś Kryształu Powrotu i uciekłeś w porę! Życie Twojej postaci zostało uratowane. Czas, opłaty licencyjne oraz reputacja zostały przywrócone do stanu sprzed przekroczenia bramy. Zdobycze z tego rajdu zostały unicestwione.`);
    }

    /**
     * RESUMES EXECUTING TICK PROGRESSION
     */
    executeContinueFight() {
        document.getElementById('escape-prompt-modal').classList.add('hidden');
        window.dungeonsSystem.isPaused = false;
        this.showSystemAlert(`[DAVY JONES' LOCKER]\nZdecydowałeś się walczyć dalej. Każdy kolejny cios potworów może okazać się ostatecznym ciosem dla Twojego łowcy!`);
    }

    /**
     * TRAGIC COMPONENT POPUP SHOW FOR DEATH OVERLAYS
     */
    showDeathScreen() {
        document.getElementById('death-screen-modal').classList.remove('hidden');
    }

    /**
     * RESTORES SOURCE STABLE BACKUP ON SOLID DEATH OVERLAY CLICK
     */
    executeRestoreBackupAndRevive() {
        const backupData = localStorage.getItem(window.gameState.SAVE_KEY + "_dungeon_backup");
        if (backupData) {
            window.gameState.state = JSON.parse(backupData);
            window.gameState.save();
            console.log("[SYSTEM] Przywrócono stan łowcy bezpośrednio sprzed rozpoczęcia rażącej wyprawy.");
        } else {
            // Fallback recovery
            window.gameState.state.player.hp = Math.floor((window.gameState.state.player.maxHp || 100) * 0.15);
            window.gameState.save();
        }

        document.getElementById('death-screen-modal').classList.add('hidden');
        window.dungeonsSystem.battleActive = false;
        window.dungeonsSystem.isPaused = false;
        window.dungeonsSystem.escapePromptTriggered = false;
        window.dungeonsSystem.isGuestMercenaryRaid = false;

        this.switchTab('city');
        this.renderGatesTab();
        this.updateHUD();

        this.showSystemAlert(`[RETROSPKCJA SYSTEMU]\nZjawiskowa siła systemu powstrzymała Twoją definitywną śmierć! Twoja tożsamość została bezpiecznie odtworzona i przeniesiona do zapisu strefowego przed wejściem. Postaraj się lepiej kolejnym razem!`);
    }

    executeStartRaid(gateId) {
        this.openRaidPrep(gateId);
    }

    /**
     * SHOW DETAILED RAID SUMMARY GRAPH SCREEN
     */
    showRaidSummary(isVictory, combatStats, gate) {
        const modal = document.getElementById('raid-summary-modal');
        if (!modal) return;

        const titleEl = document.getElementById('summary-title');
        const subtitleEl = document.getElementById('summary-subtitle');
        const badgeIconEl = document.getElementById('summary-badge-icon');
        const durationEl = document.getElementById('summary-duration');
        const difficultyEl = document.getElementById('summary-difficulty');
        const expEl = document.getElementById('summary-exp');
        const goldEl = document.getElementById('summary-gold');
        const crystalsContainer = document.getElementById('summary-crystals-container');
        const lootContainer = document.getElementById('summary-loot-container');
        const partyChartEl = document.getElementById('summary-party-chart');

        if (isVictory) {
            titleEl.textContent = "ZWYCIĘSTWO!";
            titleEl.className = "glowing-text cyan-neon";
            titleEl.style.color = "var(--cyan-neon)";
            subtitleEl.textContent = `Brama [${gate.name}] została pomyślnie oczyszczona!`;
            badgeIconEl.innerHTML = `<i class="fa-solid fa-trophy" style="color: gold; text-shadow: 0 0 15px rgba(255, 215, 0, 0.6);"></i>`;
        } else {
            titleEl.textContent = "PORAŻKA";
            titleEl.className = "glowing-text";
            titleEl.style.color = "#ff3333";
            subtitleEl.textContent = `Twoja drużyna poległa w Bramie [${gate.name}].`;
            badgeIconEl.innerHTML = `<i class="fa-solid fa-skull-crossbones" style="color: #ff3333; text-shadow: 0 0 15px rgba(255, 0, 0, 0.6);"></i>`;
        }

        // Duration formatting
        if (combatStats) {
            const min = String(Math.floor(combatStats.durationSeconds / 60)).padStart(2, '0');
            const sec = String(combatStats.durationSeconds % 60).padStart(2, '0');
            durationEl.textContent = `${min}:${sec}`;
            difficultyEl.textContent = gate.rank;
            difficultyEl.className = `rank rank-${gate.rank}`;
            
            const isMercenaryRaid = window.dungeonsSystem && window.dungeonsSystem.isGuestMercenaryRaid;
            expEl.textContent = `+${combatStats.expGained} EXP` + (isMercenaryRaid ? " (Udział 40%)" : "");
            goldEl.textContent = `+${combatStats.goldEarned} Złota` + (isMercenaryRaid ? " (Żołd kontraktowy najemnika)" : "");

            const contractBadge = document.getElementById('summary-mercenary-contract-badge');
            if (contractBadge) {
                contractBadge.style.display = (isMercenaryRaid && isVictory) ? 'block' : 'none';
            }
        }

        // Render crystals by rank
        crystalsContainer.innerHTML = '';
        const crystalTiers = ['E', 'D', 'C', 'B', 'A', 'S'];
        const crystalColors = {
            'E': '#888888',
            'D': '#1e40af',
            'C': '#06b6d4',
            'B': '#8b5cf6',
            'A': '#f59e0b',
            'S': '#dc2626'
        };

        let hasCrystals = false;
        crystalTiers.forEach(tier => {
            const count = combatStats && combatStats.manaCrystalsEarned ? (combatStats.manaCrystalsEarned[tier] || 0) : 0;
            if (count > 0 || tier === gate.rank) {
                hasCrystals = true;
                const cell = document.createElement('div');
                cell.style.background = 'rgba(0,0,0,0.3)';
                cell.style.border = `1px solid ${crystalColors[tier] || 'rgba(255,255,255,0.1)'}`;
                cell.style.borderRadius = '4px';
                cell.style.padding = '6px';
                cell.style.textAlign = 'center';
                cell.style.fontSize = '10px';
                cell.innerHTML = `
                    <div style="font-weight: bold; color: ${crystalColors[tier]}; margin-bottom: 2px;">Ranga ${tier}</div>
                    <div style="font-size: 11px; font-weight: bold; color: #fff;">+${count} szt.</div>
                `;
                crystalsContainer.appendChild(cell);
            }
        });
        if (!hasCrystals) {
            crystalsContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 11px;">Brak pozyskanych kryształów.</span>`;
        }

        // Display items obtained
        lootContainer.innerHTML = '';
        if (isVictory && combatStats && combatStats.itemsObtained && combatStats.itemsObtained.length > 0) {
            combatStats.itemsObtained.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.style.display = 'flex';
                itemDiv.style.alignItems = 'center';
                itemDiv.style.justifyContent = 'space-between';
                itemDiv.style.background = 'rgba(255,255,255,0.03)';
                itemDiv.style.border = '1px solid rgba(255,255,255,0.06)';
                itemDiv.style.borderRadius = '4px';
                itemDiv.style.padding = '8px 12px';
                itemDiv.style.fontSize = '11px';

                // Rarity color mapping
                const rColors = {
                    'Pospolity': '#aaaaaa',
                    'Szary': '#aaaaaa',
                    'Uncommon': '#4caf50',
                    'Zielony': '#4caf50',
                    'Rzadki': '#00f3ff',
                    'Niebieski': '#00f3ff',
                    'Epicki': '#9000ff',
                    'Fioletowy': '#9000ff',
                    'Legendarny': '#ff9000',
                    'Pomarańczowy': '#ff9000'
                };
                const col = rColors[item.rarity] || '#ffffff';

                itemDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-shield-halved" style="color: ${col}; font-size: 14px;"></i>
                        <div>
                            <span style="font-weight: bold; color: ${col};">[${item.rarity}] ${item.name}</span>
                            <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Dodatkowy bonus: ${item.statBonusText || 'Brak'}</div>
                        </div>
                    </div>
                `;
                lootContainer.appendChild(itemDiv);
            });
        } else {
            lootContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 10px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 4px; width: 100%;">
                    Brak nowych unikalnych przedmiotów z tej wyprawy.
                </div>
            `;
        }

        // Render damage share comparison graph
        partyChartEl.innerHTML = '';
        if (combatStats) {
            const idsList = Object.keys(combatStats.damageDealt);
            if (idsList.length === 0) {
                idsList.push('player');
            }

            // Also include active companions currently in party who might have dealt 0 dmg
            window.gameState.state.party.forEach(id => {
                if (!idsList.includes(id)) {
                    idsList.push(id);
                }
            });

            let totalPartyDmg = 0;
            idsList.forEach(id => {
                totalPartyDmg += (combatStats.damageDealt[id] || 0);
            });

            const durationSec = combatStats.durationSeconds || 1;

            idsList.forEach(id => {
                let name = "Bohater";
                if (id === 'player') {
                    name = window.gameState.state.player.name || "Bohater";
                } else {
                    const comp = window.gameState.state.companions[id];
                    if (comp) name = comp.name;
                }

                const dmg = combatStats.damageDealt[id] || 0;
                const heal = combatStats.damageHealed[id] || 0;
                const dps = (dmg / durationSec).toFixed(1);
                const percent = totalPartyDmg > 0 ? Math.round((dmg / totalPartyDmg) * 100) : 0;

                const barDiv = document.createElement('div');
                barDiv.style.display = 'flex';
                barDiv.style.flexDirection = 'column';
                barDiv.style.gap = '4px';

                barDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                        <span style="font-weight: bold; color: #fff;">${name} <span style="font-size: 10px; color: var(--text-muted); font-weight: normal;">(DPS: ${dps})</span></span>
                        <span style="font-weight: bold; color: var(--cyan-neon);">${dmg} dmg / ${heal} leczenie <span style="font-size: 10px; color: var(--text-muted); font-weight: normal;">(${percent}%)</span></span>
                    </div>
                    <div style="width: 100%; height: 10px; background: rgba(0,0,0,0.5); border-radius: 5px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="width: ${Math.max(2, percent)}%; height: 100%; background: linear-gradient(90deg, var(--violet-neon), var(--cyan-neon)); border-radius: 5px; transition: width 0.5s ease;"></div>
                    </div>
                `;
                partyChartEl.appendChild(barDiv);
            });
        }

        modal.classList.remove('hidden');
    }

    closeRaidSummary() {
        document.getElementById('raid-summary-modal').classList.add('hidden');
        window.dungeonsSystem.isGuestMercenaryRaid = false;
        this.switchTab('combat');
        this.renderGatesTab();
        this.updateHUD();
    }

    /**
     * SHADOW BESTIARY HANDLERS
     */
    openBestiaryModal() {
        this.bestiaryPage = 1;
        this.bestiaryItemsPerPage = 20;
        this.bestiarySearchQuery = "";
        this.bestiaryRankQuery = "ALL";
        
        // Reset fields
        const searchInput = document.getElementById('bestiary-search-input');
        const rankSelect = document.getElementById('bestiary-rank-select');
        if (searchInput) searchInput.value = "";
        if (rankSelect) rankSelect.value = "ALL";

        document.getElementById('bestiary-modal').classList.remove('hidden');
        this.renderBestiaryList();
    }

    closeBestiaryModal() {
        document.getElementById('bestiary-modal').classList.add('hidden');
    }

    handleBestiarySearch() {
        const queryVal = document.getElementById('bestiary-search-input').value;
        const rankVal = document.getElementById('bestiary-rank-select').value;
        this.bestiarySearchQuery = queryVal || "";
        this.bestiaryRankQuery = rankVal || "ALL";
        this.bestiaryPage = 1; // reset page on search filter change
        this.renderBestiaryList();
    }

    changeBestiaryPage(direction) {
        this.bestiaryPage = Math.max(1, this.bestiaryPage + direction);
        this.renderBestiaryList();
    }

    renderBestiaryList() {
        const grid = document.getElementById('bestiary-grid');
        const loading = document.getElementById('bestiary-loading');
        if (!grid) return;

        if (loading) loading.classList.remove('hidden');

        // Query procedural monsters list deterministically
        const offset = (this.bestiaryPage - 1) * this.bestiaryItemsPerPage;
        const data = window.monstersDB.search(this.bestiarySearchQuery, this.bestiaryRankQuery, this.bestiaryItemsPerPage, offset);

        // Update counts
        document.getElementById('bestiary-total-count').textContent = data.total;
        document.getElementById('bestiary-page-current').textContent = this.bestiaryPage;

        // Disable/enable pagination buttons
        const prevBtn = document.getElementById('bestiary-prev-btn');
        const nextBtn = document.getElementById('bestiary-next-btn');

        if (prevBtn) prevBtn.disabled = (this.bestiaryPage <= 1);
        if (nextBtn) nextBtn.disabled = (offset + this.bestiaryItemsPerPage >= data.total);

        grid.innerHTML = '';

        if (data.monsters.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted); font-size: 12px;">
                    <i class="fa-solid fa-binoculars" style="font-size: 24px; color: rgba(255,255,255,0.1); margin-bottom: 10px;"></i><br>
                    Brak potworów spełniających kryteria wyszukiwania. Spróbuj zmienić filtry.
                </div>
            `;
            if (loading) loading.classList.add('hidden');
            return;
        }

        data.monsters.forEach(m => {
            const card = document.createElement('div');
            card.style.background = 'rgba(0,0,0,0.45)';
            card.style.border = '1px solid rgba(255,255,255,0.05)';
            card.style.borderRadius = '5px';
            card.style.padding = '12px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.gap = '8px';
            card.style.transition = 'border-color 0.2s, box-shadow 0.2s';

            // Rarity colors based on rank label badges
            const rankColors = {
                'E': '#888888',
                'D': '#1e40af',
                'C': '#06b6d4',
                'B': '#8b5cf6',
                'A': '#f59e0b',
                'S': '#dc2626'
            };
            const rCol = rankColors[m.rank] || '#ccc';

            // Render stats card
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="font-size: 11px; font-weight: bold; color: #fff; line-height: 1.3;">${m.name}</div>
                    <span class="rank rank-${m.rank}" style="scale: 0.85; transform-origin: top right; padding: 1px 4px;">${m.rank}</span>
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">Poziom: <span style="color: #fff; font-weight: bold;">Lvl ${m.level}</span></div>
                <p style="font-size: 10px; color: #ccc; margin: 0; line-height: 1.3; font-style: italic; min-height: 26px;">
                    ${m.description}
                </p>
                <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; margin-top: 2px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; font-size: 10px; color: var(--text-muted);">
                        <span>HP: <span style="color: #ff3333; font-weight: bold;">${m.hp}</span></span>
                        <span>ATK: <span style="color: #38bdf8; font-weight: bold;">${m.patk}</span></span>
                        <span>DEF: <span style="color: #fb7185; font-weight: bold;">${m.def}</span></span>
                        <span>PRĘD: <span style="color: #4ade80; font-weight: bold;">${m.speed}</span></span>
                    </div>
                </div>
                <div style="border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 6px; margin-top: 2px; font-size: 9px; color: var(--text-muted); line-height: 1.2;">
                    <i class="fa-solid fa-gem" style="margin-right: 2px; color: gold;"></i> Potencjalne Łupy: <br>
                    <span style="color: #93c5fd; font-weight: bold;">${m.drops.join(', ')}</span>
                </div>
            `;
            grid.appendChild(card);
        });

        if (loading) loading.classList.add('hidden');
    }
}

window.uiEngine = new UIEngine();
