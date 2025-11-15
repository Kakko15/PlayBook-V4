import supabase from "../supabaseClient.js";
import { generateRoundRobin, calculateElo } from "../utils/tournamentLogic.js";
import { sanitize, sanitizeObject } from "../utils/sanitize.js";

export const createTournament = async (req, res) => {
  const { name, game } = req.body;
  const ownerId = req.user.userId;

  console.log("=== CREATE TOURNAMENT DEBUG ===");
  console.log("Name:", name);
  console.log("Game:", game);
  console.log("Owner ID:", ownerId);

  if (!name || !game) {
    return res.status(400).json({ message: "Name and game are required." });
  }

  try {
    // Create tournament directly without RPC function
    console.log("Attempting to insert tournament...");
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        name: sanitize(name),
        game: sanitize(game),
        owner_id: ownerId, // Required field
      })
      .select()
      .single();

    console.log("Tournament insert result:", { tournament, tournamentError });

    if (tournamentError) {
      console.error("Tournament insert error:", tournamentError);
      console.error("Error code:", tournamentError.code);
      console.error("Error message:", tournamentError.message);
      console.error("Error details:", tournamentError.details);
      console.error("Error hint:", tournamentError.hint);
      return res.status(500).json({
        message: "Error creating tournament.",
        error: tournamentError.message,
        details: tournamentError.details,
        hint: tournamentError.hint,
      });
    }

    if (!tournament) {
      console.error("No tournament data returned");
      return res
        .status(500)
        .json({ message: "Tournament creation failed to return data." });
    }

    console.log("Tournament created successfully:", tournament.id);

    // Add the creator as a collaborator
    console.log("Adding collaborator...");
    const { data: collaborator, error: collaboratorError } = await supabase
      .from("collaborators")
      .insert({
        tournament_id: tournament.id,
        user_id: ownerId,
        role: "owner",
      })
      .select();

    if (collaboratorError) {
      console.error("Collaborator creation error:", collaboratorError);
      console.error("Collaborator error code:", collaboratorError.code);
      console.error("Collaborator error message:", collaboratorError.message);
      console.error("Collaborator error details:", collaboratorError.details);
      console.log(
        "Continuing without collaborator entry (using owner_id instead)"
      );
      // Don't fail - we have owner_id in the tournament already
    } else {
      console.log("Collaborator added successfully:", collaborator);
    }

    console.log("=== CREATE TOURNAMENT SUCCESS ===");
    res.status(201).json(tournament);
  } catch (error) {
    console.error("=== CREATE TOURNAMENT EXCEPTION ===");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    res
      .status(500)
      .json({ message: "Error creating tournament.", error: error.message });
  }
};

export const getMyTournaments = async (req, res) => {
  const userId = req.user.userId;
  console.log("=== GET MY TOURNAMENTS ===");
  console.log("User ID:", userId);

  try {
    // Try with collaborators first
    console.log("Trying collaborators query...");
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

    console.log("Collaborators query result:", {
      dataLength: collabData?.length,
      error: collabError?.message,
    });

    // If collaborators query works AND has data, use it
    if (!collabError && collabData && collabData.length > 0) {
      console.log("Returning tournaments from collaborators query");
      return res.status(200).json(collabData);
    }

    // Fallback: query by owner_id directly
    console.log("Using owner_id fallback query...");
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

    console.log("Owner_id query result:", {
      dataLength: data?.length,
      error: error?.message,
    });

    if (error) throw error;

    console.log("Returning tournaments from owner_id query");
    res.status(200).json(data);
  } catch (error) {
    console.error("Get My Tournaments Error:", error.message);
    res.status(500).json({ message: "Error fetching tournaments." });
  }
};

export const getTournamentById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  console.log("=== GET TOURNAMENT BY ID ===");
  console.log("Tournament ID:", id);
  console.log("User ID:", userId);

  try {
    // Try with collaborators first
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
      console.log("Tournament found via collaborators");
      return res.status(200).json(collabData);
    }

    // Fallback: query by owner_id
    console.log("Trying owner_id fallback...");
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .eq("owner_id", userId)
      .single();

    if (error) throw error;
    if (!data) {
      return res
        .status(404)
        .json({ message: "Tournament not found or access denied." });
    }

    console.log("Tournament found via owner_id");
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Tournament By Id Error:", error.message);
    res.status(500).json({ message: "Error fetching tournament details." });
  }
};

export const updateTournament = async (req, res) => {
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

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Update Tournament Error:", error.message);
    res.status(500).json({ message: "Error updating tournament." });
  }
};

export const deleteTournament = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from("tournaments").delete().eq("id", id);
    if (error) throw error;
    res.status(200).json({ message: "Tournament deleted successfully." });
  } catch (error) {
    console.error("Delete Tournament Error:", error.message);
    res.status(500).json({ message: "Error deleting tournament." });
  }
};

export const getTeams = async (req, res) => {
  const { tournamentId } = req.params;
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*, players(count)")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Teams Error:", error.message);
    res.status(500).json({ message: "Error fetching teams." });
  }
};

export const addTeam = async (req, res) => {
  const { tournamentId } = req.params;
  const { name, logo_url } = req.body;
  const { userId } = req.user;

  if (!name) {
    return res.status(400).json({ message: "Team name is required." });
  }

  try {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: sanitize(name),
        logo_url: sanitize(logo_url) || null,
        tournament_id: tournamentId,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc("log_activity", {
      p_icon: "group_add",
      p_color: "text-blue-600",
      p_title: "New Team Added",
      p_description: `"${sanitize(name)}" joined a tournament.`,
      p_tournament_id: tournamentId,
      p_user_id: userId,
    });

    res.status(201).json(data);
  } catch (error) {
    console.error("Add Team Error:", error.message);
    res.status(500).json({ message: "Error adding team." });
  }
};

export const updateTeam = async (req, res) => {
  const { teamId } = req.params;
  const { name, logo_url } = req.body;

  try {
    const { data, error } = await supabase
      .from("teams")
      .update({
        name: sanitize(name),
        logo_url: sanitize(logo_url) || null,
      })
      .eq("id", teamId)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Update Team Error:", error.message);
    res.status(500).json({ message: "Error updating team." });
  }
};

export const deleteTeam = async (req, res) => {
  const { teamId } = req.params;
  try {
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    if (error) throw error;
    res.status(200).json({ message: "Team deleted successfully." });
  } catch (error) {
    console.error("Delete Team Error:", error.message);
    res.status(500).json({ message: "Error deleting team." });
  }
};

export const getPlayers = async (req, res) => {
  const { teamId } = req.params;
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("name", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Players Error:", error.message);
    res.status(500).json({ message: "Error fetching players." });
  }
};

export const addPlayer = async (req, res) => {
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

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error("Add Player Error:", error.message);
    res.status(500).json({ message: "Error adding player." });
  }
};

export const updatePlayer = async (req, res) => {
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

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Update Player Error:", error.message);
    res.status(500).json({ message: "Error updating player." });
  }
};

export const deletePlayer = async (req, res) => {
  const { playerId } = req.params;
  try {
    const { error } = await supabase
      .from("players")
      .delete()
      .eq("id", playerId);
    if (error) throw error;
    res.status(200).json({ message: "Player deleted successfully." });
  } catch (error) {
    console.error("Delete Player Error:", error.message);
    res.status(500).json({ message: "Error deleting player." });
  }
};

export const generateSchedule = async (req, res) => {
  const { id: tournament_id } = req.params;
  const { userId } = req.user;

  try {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("tournament_id", tournament_id);

    if (teamsError) throw teamsError;
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

    if (insertError) throw insertError;

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
    console.error("Generate Schedule Error:", error.message);
    res.status(500).json({ message: "Error generating schedule." });
  }
};

export const generatePlayoffBracket = async (req, res) => {
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

    if (teamsError) throw teamsError;
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
    if (finalError) throw finalError;

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
    if (sf1Error) throw sf1Error;

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
    if (sf2Error) throw sf2Error;

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
    if (qfError) throw qfError;

    res.status(201).json({ message: "8-team bracket generated successfully." });
  } catch (error) {
    console.error("Generate Bracket Error:", error.message);
    res.status(500).json({ message: "Error generating bracket." });
  }
};

export const getSchedule = async (req, res) => {
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

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Schedule Error:", error.message);
    res.status(500).json({ message: "Error fetching schedule." });
  }
};

export const getStandings = async (req, res) => {
  const { id: tournament_id } = req.params;
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournament_id)
      .order("wins", { ascending: false })
      .order("losses", { ascending: true })
      .order("elo_rating", { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Get Standings Error:", error.message);
    res.status(500).json({ message: "Error fetching standings." });
  }
};

export const getMatchDetails = async (req, res) => {
  const { id: match_id } = req.params;
  try {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select(
        "*, team1:teams!matches_team1_id_fkey(*, players(*)), team2:teams!matches_team2_id_fkey(*, players(*))"
      )
      .eq("id", match_id)
      .single();

    if (matchError) throw matchError;
    if (!match) {
      return res.status(404).json({ message: "Match not found." });
    }

    res.status(200).json(match);
  } catch (error) {
    console.error("Get Match Details Error:", error.message);
    res.status(500).json({ message: "Error fetching match details." });
  }
};

export const logMatchResult = async (req, res) => {
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
        "*, tournament:tournaments!inner(*), team1:teams!matches_team1_id_fkey(*), team2:teams!matches_team2_id_fkey(*)"
      )
      .eq("id", match_id)
      .single();

    if (matchError) throw matchError;
    if (!match) return res.status(404).json({ message: "Match not found." });

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
    });

    if (rpcError) throw rpcError;

    res.status(200).json({ message: "Match result logged successfully." });
  } catch (error) {
    console.error("Log Match Result Error:", error.message);
    res.status(500).json({ message: "Error logging match result." });
  }
};
