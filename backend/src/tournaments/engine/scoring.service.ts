import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoringService {
  /**
   * Calculate score based on scoring engine rules
   * @param placement Rank achieved in match
   * @param kills Number of kills
   * @param scoringEngine JSON string or object defining points
   */
  calculateScore(placement: number, kills: number, scoringEngine: any): number {
    let rules =
      typeof scoringEngine === 'string'
        ? JSON.parse(scoringEngine)
        : scoringEngine;

    if (!rules) {
      // Default fallback (1pt per kill, 10pts for win)
      rules = { '1': 10, kill: 1 };
    }

    const placementPoints = Number(rules[String(placement)]) || 0;
    const killPoints = (Number(rules['kill']) || 1) * kills;

    return placementPoints + killPoints;
  }
}
