import { VoidlingState, CodexArtifact } from '../types';
import { INITIAL_STATE, CODEX_ARTIFACTS } from './gameData';

const STORAGE_KEY = 'voidling_save_v1';

export function loadSavedState(): VoidlingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL_STATE };

    const parsed = JSON.parse(raw);
    // Deep merge with INITIAL_STATE to ensure new fields are populated safely
    return {
      ...INITIAL_STATE,
      ...parsed,
      stats: {
        ...INITIAL_STATE.stats,
        ...(parsed.stats || {}),
      },
      activeMutations: Array.isArray(parsed.activeMutations) ? parsed.activeMutations : [],
      unlockedArtifacts: Array.isArray(parsed.unlockedArtifacts) ? parsed.unlockedArtifacts : [],
      secretCodesUsed: Array.isArray(parsed.secretCodesUsed) ? parsed.secretCodesUsed : [],
      isDisguised: false, // Always start un-disguised
    };
  } catch (err) {
    console.error('Failed to parse saved state, resetting to initial:', err);
    return { ...INITIAL_STATE };
  }
}

export function saveStateToStorage(state: VoidlingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function checkArtifactUnlocks(
  state: VoidlingState,
  onUnlock?: (artifact: CodexArtifact) => void
): string[] {
  const unlocked = new Set<string>(state.unlockedArtifacts);
  let changed = false;

  CODEX_ARTIFACTS.forEach(artifact => {
    if (unlocked.has(artifact.id)) return;

    let conditionMet = false;
    switch (artifact.id) {
      case 'art_floppy_zero':
        conditionMet = state.stats.foodEaten >= 5;
        break;
      case 'art_bsod_fragment':
        conditionMet = state.stats.totalClicks >= 25;
        break;
      case 'art_quantum_die':
        conditionMet = state.stats.hackedNodes >= 3;
        break;
      case 'art_cursor_specter':
        conditionMet = state.stats.invadersBanished >= 10;
        break;
      case 'art_matrix_tape':
        conditionMet = state.stats.secretsFound >= 1;
        break;
      case 'art_cosmic_prism':
        conditionMet = state.stage >= 3;
        break;
      case 'art_ouroboros_chip':
        conditionMet = state.stage >= 5;
        break;
      case 'art_boss_badge':
        conditionMet = state.isDisguised;
        break;
    }

    if (conditionMet) {
      unlocked.add(artifact.id);
      changed = true;
      if (onUnlock) onUnlock(artifact);
    }
  });

  return changed ? Array.from(unlocked) : state.unlockedArtifacts;
}

export function exportBackupJson(state: VoidlingState): string {
  return JSON.stringify(state, null, 2);
}

export function parseBackupJson(raw: string): VoidlingState | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      ...INITIAL_STATE,
      ...parsed,
      stats: {
        ...INITIAL_STATE.stats,
        ...(parsed.stats || {}),
      },
    };
  } catch (e) {
    return null;
  }
}
