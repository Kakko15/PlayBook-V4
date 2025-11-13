import express from "express";
import {
  createTournament,
  getMyTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  getTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  getPlayers,
  addPlayer,
  updatePlayer,
  deletePlayer,
} from "../controllers/tournamentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

// Tournament Routes
router.post("/", createTournament);
router.get("/my-tournaments", getMyTournaments);
router.get("/:id", getTournamentById);
router.put("/:id", updateTournament);
router.delete("/:id", deleteTournament);

// Team Routes
router.get("/:tournamentId/teams", getTeams);
router.post("/:tournamentId/teams", addTeam);
router.put("/teams/:teamId", updateTeam);
router.delete("/teams/:teamId", deleteTeam);

// Player Routes
router.get("/teams/:teamId/players", getPlayers);
router.post("/teams/:teamId/players", addPlayer);
router.put("/players/:playerId", updatePlayer);
router.delete("/players/:playerId", deletePlayer);

export default router;
