/**
 * Abyss Monarch - Skills and Fusion System
 * Handles active/passive skills database, usage formulas, and the Skill Fusion Matrix.
 */

class SkillsSystem {
    constructor() {
        this.skills = {
            // == BASELINE SKILLS ==
            'strike': {
                id: 'strike',
                name: 'Ciężkie Uderzenie',
                type: 'active',
                classRestriction: ['Warrior', 'Novice'],
                desc: 'Mocne, fizyczne uderzenie zadające wysokie obrażenia pojedynczemu celowi.',
                mpCost: 10,
                cooldown: 4, // seconds
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.patk * (1.2 + lvl * 0.15)
            },
            'provoke': {
                id: 'provoke',
                name: 'Prowokacja',
                type: 'active',
                classRestriction: ['Warrior', 'Knight', 'Berserker'],
                desc: 'Okrzyk bojowy skupiający uwagę wszystkich wrogów na rzucającym.',
                mpCost: 12,
                cooldown: 8,
                target: 'all_enemies',
                effect: 'taunt',
                formula: (caster, lvl) => 0 // Force aggro
            },
            'fireball': {
                id: 'fireball',
                name: 'Kula Ognia',
                type: 'active',
                classRestriction: ['Mage', 'Novice'],
                desc: 'Ciska ognistym pociskiem, podpalając wroga i zadając wysokie obrażenia magiczne.',
                mpCost: 15,
                cooldown: 5,
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.matk * (1.3 + lvl * 0.2)
            },
            'wind_gust': {
                id: 'wind_gust',
                name: 'Pchnięcie Wiatru',
                type: 'active',
                classRestriction: ['Mage', 'Sorcerer', 'Ranger'],
                desc: 'Uwalnia potężny podmuch wiatru raniący wroga i zmniejszający jego szybkość ataku.',
                mpCost: 12,
                cooldown: 6,
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.matk * (1.0 + lvl * 0.1)
            },
            'mana_shield': {
                id: 'mana_shield',
                name: 'Tarcza Mana',
                type: 'active',
                classRestriction: ['Mage', 'Novice', 'Cleric'],
                desc: 'Tworzy wokół postaci tarczę pochłaniającą nadchodzące obrażenia za pomocą punktów many.',
                mpCost: 20,
                cooldown: 12,
                target: 'self',
                effect: 'shield',
                formula: (caster, lvl) => caster.derived.maxMp * (0.3 + lvl * 0.05)
            },
            'quick_cut': {
                id: 'quick_cut',
                name: 'Szybkie Cięcie',
                type: 'active',
                classRestriction: ['Assassin', 'Novice'],
                desc: 'Błyskawiczne pchnięcie z szansą na pominięcie pancerza celu.',
                mpCost: 10,
                cooldown: 3,
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.patk * (1.1 + lvl * 0.1)
            },
            'poison_dart': {
                id: 'poison_dart',
                name: 'Zatruta Strzałka',
                type: 'active',
                classRestriction: ['Assassin', 'Viper', 'Ranger'],
                desc: 'Strzela zatrutą strzałką, zadając obrażenia i zatruwając cel na 5 sekund.',
                mpCost: 14,
                cooldown: 7,
                target: 'enemy',
                effect: 'poison',
                formula: (caster, lvl) => caster.derived.patk * (0.8 + lvl * 0.1) // Dot ticked during dungeon fight
            },
            'aimed_shot': {
                id: 'aimed_shot',
                name: 'Mierzony Strzał',
                type: 'active',
                classRestriction: ['Ranger', 'Sniper'],
                desc: 'Precyzyjny strzał z łuku zadający wysokie obrażenia fizyczne. Szansa na krytyka zwiększona o 20%.',
                mpCost: 15,
                cooldown: 5,
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.patk * (1.4 + lvl * 0.2)
            },
            'heal': {
                id: 'heal',
                name: 'Leczenie',
                type: 'active',
                classRestriction: ['Cleric', 'Novice'],
                desc: 'Przywraca punkty zdrowia sojusznikowi z najniższym poziomem HP w drużynie.',
                mpCost: 15,
                cooldown: 5,
                target: 'lowest_hp_ally',
                effect: 'heal',
                formula: (caster, lvl) => caster.derived.matk * (1.5 + lvl * 0.25)
            },
            'holy_shield': {
                id: 'holy_shield',
                name: 'Święta Tarcza',
                type: 'active',
                classRestriction: ['Cleric', 'Priest'],
                desc: 'Otacza sojusznika barierą światła absorbującą obrażenia.',
                mpCost: 18,
                cooldown: 10,
                target: 'lowest_hp_ally',
                effect: 'shield',
                formula: (caster, lvl) => caster.derived.matk * (1.2 + lvl * 0.2)
            },

            // == FUSED ENDGAME SKILLS ==
            'flame_tornado': {
                id: 'flame_tornado',
                name: 'Ogniste Tornado (Fusion)',
                type: 'active',
                classRestriction: ['Mage', 'Sorcerer', 'Archmage'],
                desc: 'Połączenie ognia i wiatru. Wywołuje burzę płomieni zadającą potężne obrażenia wszystkim wrogom.',
                mpCost: 35,
                cooldown: 8,
                target: 'all_enemies',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.matk * (2.5 + lvl * 0.4)
            },
            'retaliation_strike': {
                id: 'retaliation_strike',
                name: 'Uderzenie Odwetu (Fusion)',
                type: 'active',
                classRestriction: ['Warrior', 'Berserker', 'Knight', 'Paladin'],
                desc: 'Połączenie ataku i obrony. Zadaje obrażenia fizyczne powiększone o procent maksymalnego HP.',
                mpCost: 25,
                cooldown: 6,
                target: 'enemy',
                effect: 'damage',
                formula: (caster, lvl) => caster.derived.patk * (1.5 + lvl * 0.2) + caster.derived.maxHp * (0.08 + lvl * 0.02)
            },
            'shadow_poison': {
                id: 'shadow_poison',
                name: 'Cień Toksyny (Fusion)',
                type: 'active',
                classRestriction: ['Assassin', 'ShadowBlade', 'Viper', 'MonarchOfShadows', 'PlagueMonarch'],
                desc: 'Zadaje szybkie ciosy nasycone cieniem i zabójczym jadem. Ignoruje 50% pancerza wroga.',
                mpCost: 24,
                cooldown: 5,
                target: 'enemy',
                effect: 'poison_damage',
                formula: (caster, lvl) => caster.derived.patk * (2.2 + lvl * 0.3)
            },
            'redemption_aura': {
                id: 'redemption_aura',
                name: 'Aura Odkupienia (Fusion)',
                type: 'active',
                classRestriction: ['Cleric', 'Priest', 'Archcleric', 'DivineMonarch'],
                desc: 'Stała auryczna fala. Przywraca HP całej drużynie i rzuca na nich tarczę ochronną.',
                mpCost: 40,
                cooldown: 9,
                target: 'all_allies',
                effect: 'heal_shield',
                formula: (caster, lvl) => caster.derived.matk * (1.1 + lvl * 0.15)
            }
        };

        // Fusion Recipes Database
        this.recipes = [
            {
                skillA: 'fireball',
                skillB: 'wind_gust',
                result: 'flame_tornado',
                name: 'Ogniste Tornado'
            },
            {
                skillA: 'strike',
                skillB: 'mana_shield',
                result: 'retaliation_strike',
                name: 'Uderzenie Odwetu'
            },
            {
                skillA: 'quick_cut',
                skillB: 'poison_dart',
                result: 'shadow_poison',
                name: 'Cień Toksyny'
            },
            {
                skillA: 'heal',
                skillB: 'holy_shield',
                result: 'redemption_aura',
                name: 'Aura Odkupienia'
            }
        ];
    }

    /**
     * Attempts to fuse two max-level skills for a character
     */
    fuseSkills(character, skillA_id, skillB_id) {
        // Look for recipe
        const recipe = this.recipes.find(r => 
            (r.skillA === skillA_id && r.skillB === skillB_id) ||
            (r.skillA === skillB_id && r.skillB === skillA_id)
        );

        if (!recipe) {
            return { success: false, reason: 'Te umiejętności nie pasują do żadnej receptury fuzji.' };
        }

        // Check if character actually has these skills and if they are max level (10)
        const charSkillA = character.skills.find(s => s.id === skillA_id);
        const charSkillB = character.skills.find(s => s.id === skillB_id);

        if (!charSkillA || !charSkillB) {
            return { success: false, reason: 'Postać nie posiada obu tych umiejętności.' };
        }

        if (charSkillA.level < 10 || charSkillB.level < 10) {
            return { 
                success: false, 
                reason: `Obie umiejętności muszą posiadać maksymalny poziom (10). \n` +
                        `Poziom ${charSkillA.name || skillA_id}: ${charSkillA.level}/10. \n` +
                        `Poziom ${charSkillB.name || skillB_id}: ${charSkillB.level}/10.`
            };
        }

        // Check class restriction of the result
        const resultSkill = this.skills[recipe.result];
        const currentClass = character.currentClass;
        
        if (resultSkill.classRestriction && !resultSkill.classRestriction.includes(currentClass)) {
            return {
                success: false,
                reason: `Twoja obecna klasa (${currentClass}) nie może używać powstałej umiejętności: ${resultSkill.name}.`
            };
        }

        // Perform Fusion: Remove skillA and skillB, add result at level 1
        character.skills = character.skills.filter(s => s.id !== skillA_id && s.id !== skillB_id);
        character.skills.push({ id: recipe.result, level: 1, exp: 0, maxLevel: 10 });

        // If either fused skill was equipped, unequip it and equip the new one if slot is free
        character.equippedSkills = character.equippedSkills.filter(id => id !== skillA_id && id !== skillB_id);
        if (character.equippedSkills.length < 4) {
            character.equippedSkills.push(recipe.result);
        }

        window.gameState.save();

        return {
            success: true,
            resultName: resultSkill.name,
            desc: resultSkill.desc
        };
    }

    /**
     * Levels up a skill through experience
     */
    addSkillExp(character, skillId, expAmount) {
        const skill = character.skills.find(s => s.id === skillId);
        if (!skill) return false;

        if (skill.level >= 10) return false; // Already maxed

        skill.exp += expAmount;
        let expNeeded = skill.level * 100;
        let leveledUp = false;

        while (skill.exp >= expNeeded && skill.level < 10) {
            skill.exp -= expNeeded;
            skill.level++;
            expNeeded = skill.level * 100;
            leveledUp = true;
        }

        if (leveledUp) {
            console.log(`Skill ${skillId} leveled up to ${skill.level}!`);
            window.gameState.save();
        }
        return leveledUp;
    }
}

window.skillsSystem = new SkillsSystem();
