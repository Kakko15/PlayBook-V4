import supabase from "../supabaseClient.js";
import { calculateElo } from "../utils/tournamentLogic.js";
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

    const { error: collaboratorError } = await supabase
      .from("collaborators")
      .insert({
        tournament_id: tournament.id,
        user_id: ownerId,
        role: "owner",
      });

    if (collaboratorError) {
      console.error("Error adding collaborator:", collaboratorError);
    }

    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("id, name, acronym");

    if (deptError) {
      console.error(
        "Failed to fetch departments for auto-population:",
        deptError
      );
    } else if (departments && departments.length > 0) {
      const teamsToInsert = departments.map((dept) => ({
        tournament_id: tournament.id,
        department_id: dept.id,
        name: sanitize(dept.name),
        logo_url: null,
        wins: 0,
        losses: 0,
        elo_rating: 1200,
      }));

      const { error: teamsError } = await supabase
        .from("teams")
        .insert(teamsToInsert);

      if (teamsError) {
        console.error("Failed to auto-populate teams:", teamsError);
      } else {
        await supabase.rpc("log_activity", {
          p_icon: "groups",
          p_color: "text-green-600",
          p_title: "Teams Auto-Populated",
          p_description: `Added ${teamsToInsert.length} department teams to ${tournament.name}.`,
          p_tournament_id: tournament.id,
          p_user_id: ownerId,
        });
      }
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
      .select("*, players(count), department:departments(acronym)")
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
  const { name, department_id, logo_url } = req.body;
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
        name: sanitize(name) || sanitize(department.name),
        logo_url: logo_url ? sanitize(logo_url) : null,
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
  const { name, department_id, logo_url } = req.body;

  const updates = {
    department_id: department_id,
  };

  if (name) updates.name = sanitize(name);
  if (logo_url) updates.logo_url = sanitize(logo_url);

  try {
    const { data, error } = await supabase
      .from("teams")
      .update(updates)
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

    const shuffledTeams = teams.sort(() => Math.random() - 0.5);

    let currentLayer = shuffledTeams.map((t) => ({ type: "team", id: t.id }));
    let roundNumber = 1;
    let matchNodes = [];

    while (currentLayer.length > 1) {
      const nextLayer = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          const matchNode = {
            tempId: matchNodes.length,
            round: roundNumber,
            source1: currentLayer[i],
            source2: currentLayer[i + 1],
            nextMatchTempId: null,
            winnerSlot: null,
          };

          if (currentLayer[i].type === "match") {
            currentLayer[i].node.nextMatchTempId = matchNode.tempId;
            currentLayer[i].node.winnerSlot = "team1";
          }
          if (currentLayer[i + 1].type === "match") {
            currentLayer[i + 1].node.nextMatchTempId = matchNode.tempId;
            currentLayer[i + 1].node.winnerSlot = "team2";
          }

          matchNodes.push(matchNode);
          nextLayer.push({ type: "match", node: matchNode });
        } else {
          nextLayer.push(currentLayer[i]);
        }
      }

      currentLayer = nextLayer;
      roundNumber++;
    }

    const totalRounds = roundNumber - 1;

    const getRoundName = (r, total) => {
      if (r === total) return "Finals";
      if (r === total - 1) return "Semifinals";
      if (r === total - 2) return "Quarterfinals";
      return `Round ${r}`;
    };

    const matchesToInsert = matchNodes.map((node) => ({
      tournament_id,
      round_name: getRoundName(node.round, totalRounds),
      status: "pending",
      team1_id: node.source1.type === "team" ? node.source1.id : null,
      team2_id: node.source2.type === "team" ? node.source2.id : null,
    }));

    const { data: insertedMatches, error: insertError } = await supabase
      .from("matches")
      .insert(matchesToInsert)
      .select("id");

    if (insertError) return next(insertError);

    for (let i = 0; i < matchNodes.length; i++) {
      const node = matchNodes[i];
      if (node.nextMatchTempId !== null) {
        const currentDbId = insertedMatches[i].id;
        const nextDbId = insertedMatches[node.nextMatchTempId].id;

        await supabase
          .from("matches")
          .update({
            next_match_id: nextDbId,
            winner_advances_to_slot: node.winnerSlot,
          })
          .eq("id", currentDbId);
      }
    }

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

  res.status(200).json({
    message:
      "Please use the main Schedule tab to generate the tournament bracket.",
  });
};

export const getSchedule = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("matches")
      .select(
        "*, team1:teams!matches_team1_id_fkey(*, department:departments(acronym)), team2:teams!matches_team2_id_fkey(*, department:departments(acronym))"
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
  const {
    team1_score,
    team2_score,
    player_stats,
    match_date,
    round_name,
    venue,
  } = req.body;
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

    const updates = {
      match_date: match_date || match.match_date,
      round_name: sanitize(round_name) || match.round_name,
    };
    if (venue !== undefined) {
      updates.venue = sanitize(venue);
    }

    await supabase.from("matches").update(updates).eq("id", match_id);

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
      return res.status(404).json({ message: "Match not found." });
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

export const clearSchedule = async (req, res, next) => {
  const { id: tournament_id } = req.params;
  const { userId } = req.user;

  try {
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("tournament_id", tournament_id);

    if (error) return next(error);

    await supabase.rpc("log_activity", {
      p_icon: "delete",
      p_color: "text-red-600",
      p_title: "Schedule Cleared",
      p_description: `The tournament schedule has been cleared.`,
      p_tournament_id: tournament_id,
      p_user_id: userId,
    });

    res.status(200).json({ message: "Schedule cleared successfully." });
  } catch (error) {
    next(error);
  }
};
