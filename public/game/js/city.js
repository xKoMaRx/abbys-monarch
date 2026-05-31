/**
 * Abyss Monarch - City Exploration System
 * Manages the day/night cycle, 9 distinct locations, shops, NPC positions, and dialogue interactions.
 */

class CitySystem {
    constructor() {
        this.locations = {
            'home': { name: 'Mieszkanie', desc: 'Twoja bezpieczna baza. Możesz tu odpocząć i zrobić Daily Quest.', coords: { x: 10, y: 15 } },
            'association': { name: 'Stowarzyszenie Łowców', desc: 'Centrum rejestracji lochów. Wynajmij najemników i sprzedaj mana kryształy.', coords: { x: 45, y: 25 } },
            'abyss_market': { name: 'Rynek Otchłani', desc: 'Podziemny czarny rynek magii. Czynny głównie w nocy.', coords: { x: 80, y: 80 } },
            'park': { name: 'Park Centralny', desc: 'Spokojna zielona oaza. Idealne miejsce na spacery i randki.', coords: { x: 20, y: 55 } },
            'shopping': { name: 'Dzielnica Handlowa', desc: 'Kupuj modny ekwipunek oraz prezenty dla swoich towarzyszy.', coords: { x: 50, y: 65 } },
            'tavern': { name: 'Tawerna Łowców', desc: 'Tętniący życiem bar łowców. Miejsce spotkań i rekrutacji wolnych strzelców.', coords: { x: 75, y: 35 } },
            'academy': { name: 'Biblioteka & Akademia', desc: 'Księgozbiory i sale wykładowe. Możesz tu studiować i zwiększać INT/WIS.', coords: { x: 15, y: 85 } },
            'training': { name: 'Centrum Treningowe', desc: 'Siłownia i dojo. Idealne do ćwiczeń siłowych (STR/DEX/VIT).', coords: { x: 85, y: 15 } },
            'gates_sector': { name: 'Sektor Bram', desc: 'Strefa zmilitaryzowana chroniąca otwarte portale lochów.', coords: { x: 50, y: 90 } }
        };

        // Gift item preferences database
        this.giftsDb = {
            'lilac_flowers': { name: 'Kwiaty Bzu', cost: 150, category: 'gift', likes: { min_ah: 15, jin_soo: 2, yu_na: 8 } },
            'energy_drink': { name: 'Napój Energetyczny', cost: 50, category: 'gift', likes: { min_ah: 1, jin_soo: 12, yu_na: 3 } },
            'macarons': { name: 'Słodkie Makaroniki', cost: 100, category: 'gift', likes: { min_ah: 7, jin_soo: 4, yu_na: 15 } },
            'silver_ring': { name: 'Srebrny Pierścionek', cost: 1000, category: 'gift', likes: { min_ah: 25, jin_soo: 20, yu_na: 25 } }
        };

        // Skill Books database in Abyss Market
        this.booksDb = {
            'book_fireball': { name: 'Zwój: Kula Ognia', cost: 300, skillId: 'fireball' },
            'book_heal': { name: 'Zwój: Leczenie', cost: 300, skillId: 'heal' },
            'book_mana_shield': { name: 'Zwój: Tarcza Mana', cost: 400, skillId: 'mana_shield' },
            'book_provoke': { name: 'Zwój: Prowokacja', cost: 250, skillId: 'provoke' },
            'book_quick_cut': { name: 'Zwój: Szybkie Cięcie', cost: 300, skillId: 'quick_cut' },
            'book_poison_dart': { name: 'Zwój: Zatruta Strzałka', cost: 350, skillId: 'poison_dart' },
            'book_aimed_shot': { name: 'Zwój: Mierzony Strzał', cost: 400, skillId: 'aimed_shot' }
        };
    }

    /**
     * Increments current time by a specified hours count and updates day count if rollover occurs
     */
    advanceTime(hours) {
        let world = window.gameState.state.world;
        world.currentTime += hours;
        
        if (world.currentTime >= 24) {
            world.currentTime = world.currentTime % 24;
            world.dayCount++;
            console.log(`A new day begins! Day: ${world.dayCount}`);
            // Reset once-per-day actions
            this.resetDailyInteractions();
        }
        
        window.gameState.save();
    }

    /**
     * Checks if it's currently night time (18:00 - 06:00)
     */
    isNight() {
        const time = window.gameState.state.world.currentTime;
        return time >= 18 || time < 6;
    }

    /**
     * Retrieves the current location of an NPC based on the time of day
     */
    getNpcLocation(npcId) {
        const isNight = this.isNight();
        
        switch (npcId) {
            case 'min_ah':
                return isNight ? 'shopping' : 'academy'; // shopping (coffee shop) at night, academy in day
            case 'jin_soo':
                return isNight ? 'tavern' : 'training'; // tavern at night, training center in day
            case 'yu_na':
                return isNight ? 'association' : 'park'; // association clinic at night, central park in day
            default:
                return null;
        }
    }

    /**
     * Resets once-a-day chat limits on rollover
     */
    resetDailyInteractions() {
        // Daily quest reset
        window.gameState.state.world.dailyQuestDone = false;
        
        // Reset talk triggers
        for (let key in window.gameState.state.companions) {
            window.gameState.state.companions[key].talkedToday = false;
        }
    }

    /**
     * Handles talk option with companion NPCs, raising trust
     */
    talkToNpc(npcId) {
        const companion = window.gameState.state.companions[npcId];
        if (!companion) return { success: false, reason: 'Towarzysz nie istnieje.' };

        if (companion.recruited) {
            return { success: true, text: `"${companion.name} uśmiecha się lojalnie i salutuje gotowy do kolejnego rajdu!"`, trustGained: 0 };
        }

        if (companion.talkedToday) {
            return {
                success: true,
                text: `"${companion.name} wygląda na zajętą/ego w tym momencie. Wróć jutro, aby porozmawiać dłużej."`,
                trustGained: 0
            };
        }

        // Standard dialogue increase
        companion.talkedToday = true;
        companion.trust = Math.min(100, companion.trust + 2);
        window.gameState.save();

        let dialogue = "";
        if (npcId === 'min_ah') {
            dialogue = `"Uczenie się to proces ciągłego doskonalenia... Twoje zaangażowanie w naukę zaczyna mi imponować, Gracz."`;
        } else if (npcId === 'jin_soo') {
            dialogue = `"Haha! Dobrze cię widzieć! Siłownia dzisiaj pali się w rękach, stary! Pamiętaj, nie ma drogi na skróty do bycia tarczą!"`;
        } else if (npcId === 'yu_na') {
            dialogue = `"Cieszę się, że jesteś cały i zdrowy. W Stowarzyszeniu widziałam dziś wielu rannych łowców... Bądź ostrożny w bramach."`;
        }

        return {
            success: true,
            text: dialogue,
            trustGained: 2
        };
    }

    /**
     * Delivers a gift to an NPC, updating Affection/Sympatia based on likes database
     */
    giveGiftToNpc(npcId, giftId) {
        const companion = window.gameState.state.companions[npcId];
        const giftsInventory = window.gameState.state.inventory.gifts;
        
        if (!companion) return { success: false, reason: 'Towarzysz nie istnieje.' };
        if (!giftsInventory[giftId] || giftsInventory[giftId] <= 0) {
            return { success: false, reason: 'Nie posiadasz tego podarku w ekwipunku.' };
        }

        const giftData = this.giftsDb[giftId];
        if (!giftData) return { success: false, reason: 'Niepoprawny przedmiot.' };

        // Deduct gift
        giftsInventory[giftId]--;

        // Calculate affection boost
        const affectionGained = giftData.likes[npcId] || 2; // baseline +2 if neutral
        companion.affection = Math.min(100, companion.affection + affectionGained);
        
        // Slightly boost trust too
        companion.trust = Math.min(100, companion.trust + Math.floor(affectionGained / 3));

        window.gameState.save();

        let reaction = "";
        if (npcId === 'min_ah') {
            reaction = affectionGained >= 12 ? 
                `"Kwiaty bzu...? Skąd wiedziałeś, że to moje ulubione...? Dziękuję. Naprawdę doceniam ten gest." (Min-Ah lekko się rumieni)` :
                `"Och, podarek? Dziękuję. Postawię to na biurku."`;
        } else if (npcId === 'jin_soo') {
            reaction = affectionGained >= 12 ? 
                `"O stary! Napój energetyczny o smaku mega-żelków energetycznych! Właśnie tego potrzebowałem przed serią martwych ciągów! Jesteś gość!"` :
                `"Dzięki wielkie, ziom! Przyda się na siłce!"`;
        } else if (npcId === 'yu_na') {
            reaction = affectionGained >= 12 ? 
                `"Ojej! Prawdziwe francuskie makaroniki z kawiarni Dzielnicy Handlowej! Wyglądają prześlicznie... Zjedzmy je razem!" (Yu-Na uśmiecha się radośnie)` :
                `"Dziękuję za pomyślenie o mnie. To bardzo miłe!"`;
        }

        return {
            success: true,
            text: reaction,
            affectionGained: affectionGained
        };
    }

    /**
     * Executes a dating action in Central Park or Shopping District, boosting Affection
     */
    goOnDate(npcId) {
        const companion = window.gameState.state.companions[npcId];
        if (!companion) return { success: false, reason: 'Towarzysz nie istnieje.' };

        if (companion.trust < 30) {
            return { success: false, reason: `Musisz mieć przynajmniej 30 Zaufania (Trust) z ${companion.name}, aby zgodziła się wyjść z Tobą.` };
        }

        const dateCost = 100;
        if (!window.gameState.spendGold(dateCost)) {
            return { success: false, reason: `Randka kosztuje ${dateCost} złota (wymagane na bilety/kawiarnię).` };
        }

        // Advance time by 4 hours
        this.advanceTime(4);

        // Affection increase
        const baseAffection = 10;
        const finalAffection = Math.min(100, companion.affection + baseAffection);
        companion.affection = finalAffection;
        companion.trust = Math.min(100, companion.trust + 3);

        window.gameState.save();

        let dateDesc = "";
        if (npcId === 'min_ah') {
            dateDesc = `Spędziłeś miłe 4 godziny z Min-Ah w cichej czytelni Biblioteki, a potem wypiliście wspólnie gorącą kawę w Dzielnicy Handlowej. Min-Ah była niezwykle otwarta i opowiedziała Ci o swoich planach w Akademii.`;
        } else if (npcId === 'jin_soo') {
            dateDesc = `Wybrałeś się z Jin-Soo na szybki spacer po Parku Centralnym, po czym poszliście zjeść piekielnie ostre tteokbokki w Dzielnicy Handlowej. Jin-Soo zjadł podwójną porcję i cały czas śmiał się z Twoich żartów.`;
        } else if (npcId === 'yu_na') {
            dateDesc = `Poszedłeś z Yu-Na na romantyczny spacer po Parku Centralnym pod kwitnącymi wiśniami. Kupiliście watę cukrową i rozmawialiście o Waszych wspomnieniach z dzieciństwa przed nadejściem Bram.`;
        }

        return {
            success: true,
            text: dateDesc,
            affectionGained: baseAffection
        };
    }

    /**
     * Recruits an NPC permanently to the squad if trust requirements are met
     */
    recruitCompanion(npcId) {
        const companion = window.gameState.state.companions[npcId];
        if (!companion) return { success: false, reason: 'Towarzysz nie istnieje.' };

        if (companion.recruited) {
            return { success: false, reason: 'Ta postać jest już członkiem Twojej drużyny.' };
        }

        // Trust requirement check
        const reqTrust = npcId === 'min_ah' ? 40 : (npcId === 'jin_soo' ? 30 : 35);
        if (companion.trust < reqTrust) {
            return {
                success: false,
                reason: `Zaufanie (Trust) wynosi ${companion.trust}/${reqTrust}. Musisz je zwiększyć rozmawiając, dając prezenty lub pomagając w misjach.`
            };
        }

        // Special INT requirement check for Min-Ah
        if (npcId === 'min_ah' && window.gameState.state.player.stats.int < 30) {
            return {
                success: false,
                reason: `Twój poziom Inteligencji (INT) wynosi ${window.gameState.state.player.stats.int}/30. Min-Ah szuka równego sobie partnera intelektualnego w Akademii.`
            };
        }

        // Recruit character
        companion.recruited = true;
        
        // Add to active party slots if space permits
        if (window.gameState.state.party.length < 4) {
            window.gameState.state.party.push(npcId);
        }

        window.gameState.save();

        let joinSpeech = "";
        if (npcId === 'min_ah') {
            joinSpeech = `"Zgoda. Twoje analityczne podejście do walki i niesamowite tempo nauki skłoniły mnie do decyzji. Dołączam do Twojej drużyny. Nie zawiedź mnie."`;
        } else if (npcId === 'jin_soo') {
            joinSpeech = `"Stary! Czekałem na to zaproszenie! Moja tarcza jest Twoją tarczą! Ruszajmy rozbić parę orkowych głów!"`;
        } else if (npcId === 'yu_na') {
            joinSpeech = `"Zawsze chętnie Ci pomogę. Wierzę, że razem zdołamy ocalić wielu ludzi i bezpiecznie oczyścić Bramy. Możesz na mnie liczyć!"`;
        }

        return {
            success: true,
            text: joinSpeech
        };
    }
}

window.citySystem = new CitySystem();
