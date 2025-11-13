import supabase from "../supabaseClient.js";

export const createTournament = async (req, res) => {
  const { name, game, startDate, endDate } = req.body;
  const ownerId = req.user.userId;

  if (!name || !game) {
    return res.status(400).json({ message: "Name and game are required." });
  }

  try {
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .insert({
        name,
        game,
        start_date: startDate || null,
        end_date: endDate || null,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (tournamentError) throw tournamentError;

    const { error: collaboratorError } = await supabase
      .from("collaborators")
      .insert({
        tournament_id: tournament.id,
        user_id: ownerId,
      });

    if (collaboratorError) throw collaboratorError;

    res.status(201).json(tournament);
  } catch (error) {
    console.error("Create Tournament Error:", error.message);
    res.status(500).json({ message: "Error creating tournament." });
  }
};

export const getMyTournaments = async (req, res) => {
  const userId = req.user.userId;
  try {
    const { data, error } = await supabase
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

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Get My Tournaments Error:", error.message);
    res.status(500).json({ message: "Error fetching tournaments." });
  }
};

export const getTournamentById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  try {
    const { data, error } = await supabase
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

    if (error) throw error;
    if (!data) {
      return res
        .status(404)
        .json({ message: "Tournament not found or access denied." });
    }

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
    name,
    game,
    start_date: startDate,
    end_date: endDate,
    registration_open: registrationOpen,
  };

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
      .select("*")
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

  if (!name) {
    return res.status(400).json({ message: "Team name is required." });
  }

  try {
    const { data, error } = await supabase
      .from("teams")
      .insert({
        name,
        logo_url: logo_url || null,
        tournament_id: tournamentId,
      })
      .select()
      .single();

    if (error) throw error;
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
        name,
        logo_url: logo_url || null,
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
        name,
        team_id: teamId,
        game_specific_data: game_specific_data || null,
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
        name,
        game_specific_data: game_specific_data || null,
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
