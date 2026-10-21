export type VoidlingMood = 
  | 'ecstatic' 
  | 'curious' 
  | 'hungry' 
  | 'sleeping' 
  | 'glitched' 
  | 'zen' 
  | 'enraged';

export type VoidlingStage = 1 | 2 | 3 | 4 | 5;

export interface VoidlingStats {
  totalClicks: number;
  foodEaten: number;
  hackedNodes: number;
  invadersBanished: number;
  secretsFound: number;
  playtimeSeconds: number;
}

export interface FoodItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  cost: number;
  satietyGain: number;
  energyGain: number;
  corruptionDelta: number;
  xpGain: number;
  color: string;
}

export interface MutationNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'physical' | 'energy' | 'quantum' | 'cosmic';
  icon: string;
  requiredStage: VoidlingStage;
  prerequisites: string[];
  visualEffect: string;
  passiveBonus: string;
}

export interface CodexArtifact {
  id: string;
  title: string;
  category: 'Anomalies' | 'Relics' | 'Fragments' | 'Echoes';
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Transcendent';
  description: string;
  lore: string;
  unlocked: boolean;
  unlockRequirement: string;
  bonusText: string;
}

export interface VoidlingState {
  name: string;
  stage: VoidlingStage;
  level: number;
  xp: number;
  maxXp: number;
  mood: VoidlingMood;
  satiety: number;     // 0 - 100
  energy: number;      // 0 - 100
  corruption: number;  // 0 - 100
  resonance: number;   // 0 - 100
  xenon: number;       // Currency
  cosmicMatter: number;
  activeMutations: string[];
  unlockedArtifacts: string[];
  secretCodesUsed: string[];
  colorTheme: string;
  stats: VoidlingStats;
  lastFedTimestamp: number;
  isSleeping: boolean;
  isDisguised: boolean;
  isCompactMode: boolean;
  isAlwaysOnTop: boolean;
  speechBubble: string | null;
  speechBubbleTimeout: number | null;
}

export type ActiveTab = 'terrarium' | 'feed' | 'splicer' | 'terminal' | 'defense' | 'codex' | 'settings';
