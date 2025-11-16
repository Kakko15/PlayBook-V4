import axios from 'axios';
import eventBus from './eventBus';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send cookies with requests
  xsrfCookieName: 'XSRF-TOKEN', // Name of the cookie to read
  xsrfHeaderName: 'X-XSRF-TOKEN', // Name of the header to send
});

// Axios will now automatically read the 'XSRF-TOKEN' cookie
// and set the 'X-XSRF-TOKEN' header on state-changing requests.

// Manual interceptor to ensure XSRF token is sent
apiClient.interceptors.request.use(
  (config) => {
    // For state-changing methods, manually add XSRF token from cookie
    if (
      ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())
    ) {
      const xsrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      if (xsrfToken) {
        config.headers['X-XSRF-TOKEN'] = xsrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const fullLogout = () => {
  localStorage.removeItem('playbook-token');
  localStorage.removeItem('playbook-user');
  sessionStorage.removeItem('playbook-otp-email');
  delete apiClient.defaults.headers.common['Authorization'];
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || '';

    if (status === 401 || status === 403) {
      const currentPath = window.location.pathname;
      const isPublicPage =
        currentPath.startsWith('/login') ||
        currentPath.startsWith('/signup') ||
        currentPath.startsWith('/reset-password') ||
        currentPath.startsWith('/suspended') ||
        currentPath.startsWith('/deleted') ||
        currentPath.startsWith('/auth/callback') ||
        currentPath.startsWith('/pending-approval') ||
        currentPath.startsWith('/check-email');

      if (isPublicPage) {
        return Promise.reject(error);
      }

      fullLogout();
      let path = '/login';
      if (message.includes('User not found')) {
        path = '/deleted';
      } else if (message.includes('suspended')) {
        path = '/suspended';
      }

      eventBus.dispatch('sessionEnded', { path });
    }
    return Promise.reject(error);
  }
);

const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

const token = localStorage.getItem('playbook-token');
if (token) {
  setAuthToken(token);
}

const api = {
  setAuthToken,
  getHealth: async () => {
    const { data } = await apiClient.get('');
    return data;
  },
  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    });
    return data;
  },
  signup: async (name, email, password, recaptchaToken) => {
    const { data } = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
      recaptchaToken,
    });
    return data;
  },
  generateOtp: async () => {
    const { data } = await apiClient.post('/auth/otp/generate');
    return data;
  },
  verifyOtpSetup: async (token) => {
    const { data } = await apiClient.post('/auth/otp/verify-setup', { token });
    return data;
  },
  verifyOtpLogin: async (email, token) => {
    const { data } = await apiClient.post('/auth/otp/verify-login', {
      email,
      token,
    });
    return data;
  },
  getPendingUsers: async () => {
    const { data } = await apiClient.get('/superadmin/users/pending');
    return data;
  },
  getAllUsers: async () => {
    const { data } = await apiClient.get('/superadmin/users/all');
    return data;
  },
  approveUser: async (userId) => {
    const { data } = await apiClient.put(`/superadmin/users/approve/${userId}`);
    return data;
  },
  updateUserRole: async (userId, role) => {
    const { data } = await apiClient.put(`/superadmin/users/role/${userId}`, {
      role,
    });
    return data;
  },
  updateUserStatus: async (userId, status) => {
    const { data } = await apiClient.put(`/superadmin/users/status/${userId}`, {
      status,
    });
    return data;
  },
  deleteUser: async (userId) => {
    const { data } = await apiClient.delete(
      `/superadmin/users/delete/${userId}`
    );
    return data;
  },
  googleOAuthLogin: async (code, from) => {
    const { data } = await apiClient.post('/auth/oauth/google', { code, from });
    return data;
  },
  discordLogin: async (code, from) => {
    const { data } = await apiClient.post('/auth/oauth/discord', {
      code,
      from,
    });
    return data;
  },

  getAccountDetails: async () => {
    const { data } = await apiClient.get('/auth/account');
    return data;
  },
  updateAccountDetails: async (updates) => {
    const { data } = await apiClient.patch('/auth/account', updates);
    return data;
  },
  updatePassword: async (passwords) => {
    const { data } = await apiClient.put('/auth/password', passwords);
    return data;
  },
  getProfile: async () => {
    const { data } = await apiClient.get('/auth/profile');
    return data;
  },
  updateProfile: async (profileData) => {
    const { data } = await apiClient.patch('/auth/profile', profileData);
    return data;
  },
  updateProfilePicture: async (imageBase64) => {
    const { data } = await apiClient.post('/auth/profile/picture', {
      imageBase64,
    });
    return data;
  },
  removeProfilePicture: async () => {
    const { data } = await apiClient.delete('/auth/profile/picture');
    return data;
  },
  // The detectFace function has been removed.

  createBackup: async () => {
    const { data } = await apiClient.post('/superadmin/system/backup');
    return data;
  },
  getBackups: async () => {
    const { data } = await apiClient.get('/superadmin/system/backups');
    return data;
  },
  restoreBackup: async (storagePath) => {
    const { data } = await apiClient.post('/superadmin/system/restore', {
      storagePath,
    });
    return data;
  },

  createTournament: async (tournamentData) => {
    const { data } = await apiClient.post('/tournaments', tournamentData);
    return data;
  },
  getMyTournaments: async () => {
    const { data } = await apiClient.get('/tournaments/my-tournaments');
    return data;
  },
  getTournamentById: async (tournamentId) => {
    const { data } = await apiClient.get(`/tournaments/${tournamentId}`);
    return data;
  },
  updateTournament: async (tournamentId, updates) => {
    const { data } = await apiClient.put(
      `/tournaments/${tournamentId}`,
      updates
    );
    return data;
  },
  deleteTournament: async (tournamentId) => {
    const { data } = await apiClient.delete(`/tournaments/${tournamentId}`);
    return data;
  },
  getTeams: async (tournamentId) => {
    const { data } = await apiClient.get(`/tournaments/${tournamentId}/teams`);
    return data;
  },
  addTeam: async (tournamentId, teamData) => {
    const { data } = await apiClient.post(
      `/tournaments/${tournamentId}/teams`,
      teamData
    );
    return data;
  },
  updateTeam: async (teamId, teamData) => {
    const { data } = await apiClient.put(
      `/tournaments/teams/${teamId}`,
      teamData
    );
    return data;
  },
  deleteTeam: async (teamId) => {
    const { data } = await apiClient.delete(`/tournaments/teams/${teamId}`);
    return data;
  },
  getPlayers: async (teamId) => {
    const { data } = await apiClient.get(
      `/tournaments/teams/${teamId}/players`
    );
    return data;
  },
  addPlayer: async (teamId, playerData) => {
    const { data } = await apiClient.post(
      `/tournaments/teams/${teamId}/players`,
      playerData
    );
    return data;
  },
  updatePlayer: async (playerId, playerData) => {
    const { data } = await apiClient.put(
      `/tournaments/players/${playerId}`,
      playerData
    );
    return data;
  },
  deletePlayer: async (playerId) => {
    const { data } = await apiClient.delete(`/tournaments/players/${playerId}`);
    return data;
  },

  generateSchedule: async (tournamentId) => {
    const { data } = await apiClient.post(
      `/tournaments/${tournamentId}/schedule/generate`
    );
    return data;
  },
  generatePlayoffBracket: async (tournamentId, numTeams) => {
    const { data } = await apiClient.post(
      `/tournaments/${tournamentId}/playoffs/generate`,
      { numTeams }
    );
    return data;
  },
  getSchedule: async (tournamentId) => {
    const { data } = await apiClient.get(
      `/tournaments/${tournamentId}/schedule`
    );
    return data;
  },
  getStandings: async (tournamentId) => {
    const { data } = await apiClient.get(
      `/tournaments/${tournamentId}/standings`
    );
    return data;
  },
  getMatchDetails: async (matchId) => {
    const { data } = await apiClient.get(`/tournaments/match/${matchId}`);
    return data;
  },
  logMatchResult: async (matchId, matchData) => {
    const { data } = await apiClient.put(
      `/tournaments/match/${matchId}/log`,
      matchData
    );
    return data;
  },

  getPublicTournaments: async () => {
    const { data } = await apiClient.get('/public/tournaments');
    return data;
  },
  getPublicTournamentDetails: async (tournamentId) => {
    const { data } = await apiClient.get(`/public/tournament/${tournamentId}`);
    return data;
  },

  makePick: async (match_id, predicted_winner_team_id) => {
    const { data } = await apiClient.post('/predictions/make-pick', {
      match_id,
      predicted_winner_team_id,
    });
    return data;
  },
  getMyPicks: async (tournamentId) => {
    const { data } = await apiClient.get(
      `/predictions/${tournamentId}/my-picks`
    );
    return data;
  },
  getPickLeaderboard: async (tournamentId) => {
    const { data } = await apiClient.get(
      `/predictions/${tournamentId}/leaderboard`
    );
    return data;
  },

  trainArchetypeModel: async (game) => {
    const { data } = await apiClient.post('/ds/train/archetypes', { game });
    return data;
  },
  trainWinPredictor: async (coefficients) => {
    const { data } = await apiClient.post('/ds/train/win-predictor', {
      coefficients,
    });
    return data;
  },
  getSimilarPlayers: async (playerId, game) => {
    const { data } = await apiClient.get(
      `/ds/similar-players/${playerId}?game=${game}`
    );
    return data;
  },
  getMatchPrediction: async (matchId) => {
    const { data } = await apiClient.get(`/ds/predict/match/${matchId}`);
    return data;
  },

  getGlobalAnalytics: async () => {
    const { data } = await apiClient.get('/ds/global-analytics');
    return data;
  },

  getRecentActivity: async () => {
    const { data } = await apiClient.get('/activity/recent?limit=5');
    return data;
  },

  getAllActivity: async () => {
    const { data } = await apiClient.get('/activity/all');
    return data;
  },
};

export default api;
