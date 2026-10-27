export type HarmonyType =
  | 'SATB'
  | 'SAB'
  | 'TWO_PART'
  | 'CLOSE'
  | 'OPEN'
  | 'PARALLEL_THIRDS'
  | 'GOSPEL';

export interface HarmonyOption {
  id: HarmonyType;
  number: number;
  title: string;
  tagline: string;
  description: string;
  voices: string[];
  badgeColor: string;
  iconName: string;
}

export interface TrackStem {
  id: string;
  name: string;
  voice: 'soprano' | 'alto' | 'tenor' | 'bass' | 'piano' | 'full';
  range: string;
  color: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  isSolo: boolean;
  audioUrl?: string;
}

export interface HarmonizeJobResult {
  jobId: string;
  harmonyType: HarmonyType;
  key: string;
  tempo: number;
  title: string;
  voices: string[];
  files: {
    midi?: string;
    pdf?: string;
    audios: {
      soprano?: string;
      alto?: string;
      tenor?: string;
      bass?: string;
      full?: string;
      piano?: string;
    };
  };
}
