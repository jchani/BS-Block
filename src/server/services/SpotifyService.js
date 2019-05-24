import axios from'axios';

export function getTopArtists(access_token, timeRange, limit) {
  const config = { headers: { 'Authorization': 'Bearer ' + access_token } };
  return axios.get(`https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${timeRange}`, config);
};

export function getName(access_token) {
  const config = { headers: { 'Authorization': 'Bearer ' + access_token } };
  return axios.get('https://api.spotify.com/v1/me', config);
}

export function refreshToken(refresh_token) {
  return axios.get(`/refresh_token?refresh=${refresh_token}`);
};
