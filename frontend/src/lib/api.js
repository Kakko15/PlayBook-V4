import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect to login if we're on OTP verification or password reset pages
      const currentPath = window.location.pathname;
      const excludedPaths = ['/verify-2fa', '/reset-password'];
      const isExcluded = excludedPaths.some((path) =>
        currentPath.includes(path)
      );

      if (!isExcluded) {
        localStorage.removeItem('playbook-token');
        localStorage.removeItem('playbook-user');
        window.location.href = '/login';
      }
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
  login: async (email, password, recaptchaToken) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
      recaptchaToken,
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
  googleLogin: async (credential) => {
    const { data } = await apiClient.post('/auth/oauth/google', { credential });
    return data;
  },
  googleOAuthLogin: async (code) => {
    const { data } = await apiClient.post('/auth/oauth/google', { code });
    return data;
  },
  discordLogin: async (code) => {
    const { data } = await apiClient.post('/auth/oauth/discord', { code });
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
};

export default api;
