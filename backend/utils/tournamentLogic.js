export const generateRoundRobin = (teamIds) => {
  const schedule = [];
  const teams = [...teamIds];

  if (teams.length % 2 !== 0) {
    teams.push(null);
  }

  const numRounds = teams.length - 1;
  const numMatchesPerRound = teams.length / 2;

  for (let round = 0; round < numRounds; round++) {
    for (let i = 0; i < numMatchesPerRound; i++) {
      const team1_id = teams[i];
      const team2_id = teams[teams.length - 1 - i];

      if (team1_id && team2_id) {
        schedule.push({
          round_name: `Round ${round + 1}`,
          team1_id: team1_id,
          team2_id: team2_id,
        });
      }
    }

    teams.splice(1, 0, teams.pop());
  }

  return schedule;
};

export const calculateElo = (eloA, eloB, scoreA, k) => {
  const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (eloA - eloB) / 400));

  const newEloA = Math.round(eloA + k * (scoreA - expectedA));
  const newEloB = Math.round(eloB + k * (1 - scoreA - expectedB));

  return [newEloA, newEloB];
};
