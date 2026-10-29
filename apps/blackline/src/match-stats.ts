export const freshMatchStats=()=>({damageDealt:0,damageTaken:0,headshotKills:0,grenadeKills:0,meleeKills:0,healing:0,supplies:0,captures:0,objectiveSeconds:0});
export type MatchStats=ReturnType<typeof freshMatchStats>;
