import supabase from "../supabaseClient.js";
import { generateRoundRobin, calculateElo } from "../utils/tournamentLogic.js";
import { sanitize, sanitizeObject } from "../utils/sanitize.js";

export const createTournament = async (req, res, next) => {
  const { name, game, start_date, end_date } = req.body;
  const ownerId = req.user.userId;

  if (!name || !game) {
    return res.status(400).json({ message: "Name and game are required." });
  }

  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        name: sanitize(name),
        game: sanitize(game),
        owner_id: ownerId,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (tournamentError) return next(tournamentError);

    if (!tournament) {
      return res
        .status(500)
        .json({ message: "Tournament creation failed to return data." });
    }

    const { data: collaborator, error: collaboratorError } = await supabase
      .from("collaborators")
      .insert({
        tournament_id: tournament.id,
        user_id: ownerId,
        role: "owner",
      })
      .select();

    if (collaboratorError) {
    }

    res.status(201).json(tournament);
  } catch (error) {
    next(error);
  }
};

export const getMyTournaments = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const { data: collabData, error: collabError } = await supabase
      .from("tournaments")
      .select(
        `
        id, name, game, start_date, end_date,
        teams(count),
        collaborators!inner(user_id)
      `
      )
      .eq("collaborators.user_id", userId)
      .order("created_at", { ascending: false });

    if (!collabError && collabData && collabData.length > 0) {
      return res.status(200).json(collabData);
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select(
        `
        id, name, game, start_date, end_date,
        teams(count)
      `
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) return next(error);

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getTournamentById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const { data: collabData, error: collabError } = await supabase
      .from("tournaments")
      .select(
        `
        *,
        collaborators!inner(user_id)
      `
      )
      .eq("id", id)
      .eq("collaborators.user_id", userId)
      .single();

    if (!collabError && collabData) {
      return res.status(200).json(collabData);
    }

    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();

    if (error) return next(error);
    if (!data) {
      return res
        .status(404)
        .json({ message: "Tournament not found or access denied." });
    }

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateTournament = async (req, res, next) => {
  const { id } = req.params;
  const { name, game, startDate, endDate, registrationOpen } = req.body;

  const updates = {
    name: sanitize(name),
    game: sanitize(game),
    start_date: startDate,
    end_date: endDate,
    registration_open: registrationOpen,
  };

  Object.keys(updates).forEach(
    (key) => updates[key] === undefined && delete updates[key]
  );

  try {
    const { data, error } = await supabase
      .from("tournaments")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteTournament = async (req, res, next) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) return next(error);
    res.status(200).json({ message: "Tournament deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const getTeams = async (req, res, next) => {
  const { tournamentId } = req.params;
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*, players(count)")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const addTeam = async (req, res, next) => {
  const { tournamentId } = req.params;
  const { department_id } = req.body;
  const { userId } = req.user;

  if (!department_id) {
    return res.status(400).json({ message: "Department is required." });
  }

  try {
    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select("name, acronym")
      .eq("id", department_id)
      .single();

    if (deptError) return next(deptError);
    if (!department) {
      return res.status(404).json({ message: "Department not found." });
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: sanitize(department.name),
        logo_url: `https://avatar.vercel.sh/${department.acronym}.png`,
        tournament_id: tournamentId,
        department_id: department_id,
      })
      .select()
      .single();

    if (error) return next(error);

    await supabase.rpc("log_activity", {
      p_icon: "group_add",
      p_color: "text-blue-600",
      p_title: "New Team Added",
      p_description: `"${sanitize(department.name)}" joined a tournament.`,
      p_tournament_id: tournamentId,
      p_user_id: userId,
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const updateTeam = async (req, res, next) => {
  const { teamId } = req.params;
  const { department_id } = req.body;

  try {
    // Note: This logic assumes you only want to update the department.
    // If you also want to auto-update name, you need to fetch department info here too.
    const { data, error } = await supabase
      .from("teams")
      .update({
        department_id: department_id,
      })
      .eq("id", teamId)
      .select()
      .single();

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deleteTeam = async (req, res, next) => {
  const { teamId } = req.params;
  try {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) return next(error);
    res.status(200).json({ message: "Team deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const getPlayers = async (req, res, next) => {
  const { teamId } = req.params;
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("name", { ascending: true });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const addPlayer = async (req, res, next) => {
  const { teamId } = req.params;
  const { name, game_specific_data } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Player name is required." });
  }

  try {
    const { data, error } = await supabase
      .from("players")
      .insert({
        name: sanitize(name),
        team_id: teamId,
        game_specific_data: sanitizeObject(game_specific_data) || null,
      })
      .select()
      .single();

    if (error) return next(error);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
};

export const updatePlayer = async (req, res, next) => {
  const { playerId } = req.params;
  const { name, game_specific_data } = req.body;

  try {
    const { data, error } = await supabase
      .from("players")
      .update({
        name: sanitize(name),
        game_specific_data: sanitizeObject(game_specific_data) || null,
      })
      .eq("id", playerId)
      .select()
      .single();

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const deletePlayer = async (req, res, next) => {
  const { playerId } = req.params;
  try {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);
    if (error) return next(error);
    res.status(200).json({ message: "Player deleted successfully." });
  } catch (error) {
    next(error);
  }
};

export const bulkAddPlayers = async (req, res, next) => {
  const { tournamentId } = req.params;
  const { players } = req.body;

  if (!players || !Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ message: "Player data is required." });
  }

  try {
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("id, acronym");
    if (deptError) return next(deptError);

    const deptMap = new Map(departments.map((d) => [d.acronym, d.id]));

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, department_id")
      .eq("tournament_id", tournamentId);
    if (teamsError) return next(teamsError);

    const teamMap = new Map(teams.map((t) => [t.department_id, t.id]));

    const playersToInsert = [];
    const skippedPlayers = [];

    for (const player of players) {
      const deptId = deptMap.get(player.department_acronym);
      if (!deptId) {
        skippedPlayers.push({ ...player, reason: "Department not found" });
        continue;
      }

      const teamId = teamMap.get(deptId);
      if (!teamId) {
        skippedPlayers.push({
          ...player,
          reason: `No team for ${player.department_acronym} in this tournament.`,
        });
        continue;
      }

      playersToInsert.push({
        name: sanitize(player.name),
        team_id: teamId,
      });
    }

    if (playersToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("players")
        .insert(playersToInsert);
      if (insertError) return next(insertError);
    }

    res.status(201).json({
      message: `Successfully added ${playersToInsert.length} players.`,
      skipped: skippedPlayers.length,
      skippedPlayers,
    });
  } catch (error) {
    next(error);
  }
};

export const generateSchedule = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  const { userId } = req.user;

  try {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("tournament_id", tournament_id);

    if (teamsError) return next(teamsError);
    if (teams.length < 2) {
      return res.status(400).json({
        message: "At least two teams are required to generate a schedule.",
      });
    }

    await supabase.from("matches").delete().eq("tournament_id", tournament_id);

    const matches = generateRoundRobin(teams.map((t) => t.id));

    const matchesToInsert = matches.map((match) => ({
      tournament_id,
      team1_id: match.team1_id,
      team2_id: match.team2_id,
      status: "pending",
    }));

    const { error: insertError } = await supabase
      .from("matches")
      .insert(matchesToInsert);

    if (insertError) return next(insertError);

    await supabase.rpc("log_activity", {
      p_icon: "calendar_month",
      p_color: "text-purple-600",
      p_title: "Schedule Generated",
      p_description: `A new schedule was generated for a tournament.`,
      p_tournament_id: tournament_id,
      p_user_id: userId,
    });

    res.status(201).json({ message: "Schedule generated successfully." });
  } catch (error) {
    next(error);
  }
};

export const generatePlayoffBracket = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  const { numTeams } = req.body;

  if (![4, 8, 16].includes(numTeams)) {
    return res
      .status(400)
      .json({ message: "Number of teams must be 4, 8, or 16." });
  }

  try {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("tournament_id", tournament_id)
      .order("wins", { ascending: false })
      .order("elo_rating", { ascending: false })
      .limit(numTeams);

    if (teamsError) return next(teamsError);
    if (teams.length < numTeams) {
      return res
        .status(400)
        .json({ message: `Not enough teams for a ${numTeams}-team bracket.` });
    }

    const [seed1, seed8, seed4, seed5, seed3, seed6, seed2, seed7] = teams.map(
      (t) => t.id
    );
    const pairings = [
      [seed1, seed8],
      [seed4, seed5],
      [seed3, seed6],
      [seed2, seed7],
    ];

    const { data: finalMatch, error: finalError } = await supabase
      .from("matches")
      .insert({
        tournament_id,
        round_name: "Finals",
        status: "pending",
      })
      .select("id")
      .single();
    if (finalError) return next(finalError);

    const { data: semiFinal1, error: sf1Error } = await supabase
      .from("matches")
      .insert({
        tournament_id,
        round_name: "Semifinals",
        status: "pending",
        next_match_id: finalMatch.id,
        winner_advances_to_slot: "team1",
      })
      .select("id")
      .single();
    if (sf1Error) return next(sf1Error);

    const { data: semiFinal2, error: sf2Error } = await supabase
      .from("matches")
      .insert({
        tournament_id,
        round_name: "Semifinals",
        status: "pending",
        next_match_id: finalMatch.id,
        winner_advances_to_slot: "team2",
      })
      .select("id")
      .single();
    if (sf2Error) return next(sf2Error);

    const quarterFinals = [
      {
        pairing: pairings[0],
        next: semiFinal1.id,
        slot: "team1",
      },
      {
        pairing: pairings[1],
        next: semiFinal1.id,
        slot: "team2",
      },
      {
        pairing: pairings[2],
        next: semiFinal2.id,
        slot: "team1",
      },
      {
        pairing: pairings[3],
        next: semiFinal2.id,
        slot: "team2",
      },
    ];

    const qfMatches = quarterFinals.map((qf, index) => ({
      tournament_id,
      team1_id: qf.pairing[0],
      team2_id: qf.pairing[1],
      round_name: `Quarterfinals ${index + 1}`,
      status: "pending",
      next_match_id: qf.next,
      winner_advances_to_slot: qf.slot,
    }));

    const { error: qfError } = await supabase.from("matches").insert(qfMatches);
    if (qfError) return next(qfError);

    res.status(201).json({ message: "8-team bracket generated successfully." });
  } catch (error) {
    next(error);
  }
};

export const getSchedule = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "*, team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)"
      )
      .eq("tournament_id", tournament_id)
      .order("round_name", { ascending: true, nullsFirst: true })
      .order("match_date", { ascending: true, nullsFirst: true });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getPlayerRankings = async (req, res, next) => {
  const { tournamentId } = req.params;
  try {
    const { data, error } = await supabase
      .from("players")
      .select(
        "id, name, isu_ps, offensive_rating, defensive_rating, game_count, avg_sportsmanship, team:teams!inner(id, name, tournament_id, wins, losses)"
      )
      .eq("team.tournament_id", tournamentId)
      .order("isu_ps", { ascending: false });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getStandings = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournament_id)
      .order("wins", { ascending: false })
      .order("losses", { ascending: true })
      .order("elo_rating", { ascending: false });

    if (error) return next(error);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMatchDetails = async (req, res, next) => {
  const { id: match_id } = req.params;
  try {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        "*, team1:teams!matches_team1_id_fkey(*, players(*)), team2:teams!matches_team2_id_fkey(*, players(*))"
      )
      .eq("id", match_id)
      .single();

    if (matchError) return next(matchError);
    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    res.status(200).json(match);
  } catch (error) {
    next(error);
  }
};

export const logMatchResult = async (req, res, next) => {
  const { id: match_id } = req.params;
  const { team1_score, team2_score, player_stats, match_date, round_name } =
    req.body;
  const { userId } = req.user;

  if (team1_score == null || team2_score == null) {
    return res.status(400).json({ message: "Team scores are required." });
  }

  try {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        "*, tournament:tournaments!inner(*), team1:teams!matches_team1_id_fkey(*, department:departments!inner(id, elo_rating)), team2:teams!matches_team2_id_fkey(*, department:departments!inner(id, elo_rating))"
      )
      .eq("id", match_id)
      .single();

    if (matchError) return next(matchError);
    if (!match) return res.status(404).json({ message: "Match not found." });

    if (match.is_finalized) {
      return res
        .status(403)
        .json({ message: "This match is finalized and cannot be edited." });
    }

    if (!match.team1.department || !match.team2.department) {
      return res.status(400).json({
        message:
          "One or both teams are missing a department link. Cannot log result.",
      });
    }

    const wasCompleted = match.status === "completed";
    const oldWinnerId =
      match.team1_score > match.team2_score ? match.team1_id : match.team2_id;
    const oldLoserId =
      match.team1_score < match.team2_score ? match.team1_id : match.team2_id;

    const team1 = match.team1;
    const team2 = match.team2;
    const kFactor = match.tournament.k_factor || 32;

    const [newEloTeam1, newEloTeam2] = calculateElo(
      team1.elo_rating,
      team2.elo_rating,
      team1_score > team2_score ? 1 : 0,
      kFactor
    );

    const dept1 = match.team1.department;
    const dept2 = match.team2.department;
    const [newEloDept1, newEloDept2] = calculateElo(
      dept1.elo_rating,
      dept2.elo_rating,
      team1_score > team2_score ? 1 : 0,
      kFactor
    );

    const matchWinnerId = team1_score > team2_score ? team1.id : team2.id;
    const matchLoserId = team1_score < team2_score ? team1.id : team2.id;

    const { error: rpcError } = await supabase.rpc("atomic_log_match_result", {
      p_match_id: match_id,
      p_team1_id: team1.id,
      p_team2_id: team2.id,
      p_team1_score: team1_score,
      p_team2_score: team2_score,
      p_team1_new_elo: newEloTeam1,
      p_team2_new_elo: newEloTeam2,
      p_match_winner_id: matchWinnerId,
      p_match_loser_id: matchLoserId,
      p_was_completed: wasCompleted,
      p_old_winner_id: oldWinnerId,
      p_old_loser_id: oldLoserId,
      p_match_date: match_date || match.match_date,
      p_round_name: sanitize(round_name) || match.round_name,
      p_player_stats:
        player_stats && player_stats.length > 0 ? player_stats : null,
      p_tournament_id: match.tournament_id,
      p_user_id: userId,
      p_team1_name: team1.name,
      p_team2_name: team2.name,
      p_next_match_id: match.next_match_id,
      p_winner_advances_to_slot: match.winner_advances_to_slot,
      p_dept1_id: dept1.id,
      p_dept2_id: dept2.id,
      p_dept1_new_elo: newEloDept1,
      p_dept2_new_elo: newEloDept2,
    });

    if (rpcError) return next(rpcError);

    res.status(200).json({ message: "Match result logged successfully." });
  } catch (error) {
    next(error);
  }
};

export const finalizeMatch = async (req, res, next) => {
  const { id: match_id } = req.params;
  const { userId } = req.user;

  try {
    const { data: match, error: finalizeError } = await supabase
      .from("matches")
      .update({ is_finalized: true })
      .eq("id", match_id)
      .select("id, tournament_id, tournament:tournaments(game)")
      .single();

    if (finalizeError) return next(finalizeError);
    if (!match) {
      return res.status(4404).json({ message: "Match not found." });
    }

    const game = match.tournament.game;
    if (game) {
      const { error: metricsError } = await supabase.rpc(
        "calculate_player_metrics",
        { p_game_type: game }
      );
      if (metricsError) {
        console.error(
          "Failed to update player metrics on finalization:",
          metricsError
        );
      }
    }

    await supabase.rpc("log_activity", {
      p_icon: "lock",
      p_color: "text-blue-600",
      p_title: "Match Finalized",
      p_description: `Match ID ${match.id} was finalized and locked.`,
      p_tournament_id: match.tournament_id,
      p_user_id: userId,
    });

    res.status(200).json({ message: "Match finalized and analytics updated." });
  } catch (error) {
    next(error);
  }
};
