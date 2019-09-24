const client_id = 'af430e631a2f4420b719dd14c7901beb';
const redirect_uri = 'http://localhost:3000/callback';
const authorization_url = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirect_uri}`;
let current_access_token = '';
let expiration_time_in_secs = 0;

const Spotify = {
    getAccessToken: function() {
        if (current_access_token) {
            console.log(`Token already exists: ${current_access_token}`);
            return current_access_token;
        }
        let access_token = /access_token=(.*?)&/.exec(window.location.href);
        let expiration_time = /expires_in=(.*)/.exec(window.location.href);
        if (access_token && expiration_time) {
            console.log('Acquired access token: ' + access_token);
            current_access_token = access_token[1];
            expiration_time_in_secs = expiration_time[1];
            window.setTimeout(() => current_access_token = '', expiration_time_in_secs * 1000);
            window.history.pushState('Access Token', null, '/');
            return current_access_token;
        } else {
            console.log('No access token found. Redirecting.');
            window.location.replace(authorization_url);
            return '';
        }
    },

    search: async function(term) {
        let access_token = await this.getAccessToken();
        if (!access_token) {
            console.log('No access token available');
            return [];
        }

        const enc_term = encodeURI(term);
        return fetch(`https://api.spotify.com/v1/search?q=${enc_term}&type=track`, {
            headers: {Authorization: `Bearer ${access_token}`}
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            console.log('Search query failed.');
        }, networkError => 
        console.log(networkError.message)
        ).then(jsonResponse => {
            if (jsonResponse && jsonResponse.tracks) {
                return jsonResponse.tracks.items.map(track => {
                    return {
                        id: track.id,
                        name: track.name,
                        artist: track.artists[0].name,
                        album: track.album.name,
                        uri: track.uri
                    }
                });
            } else if (jsonResponse && jsonResponse.error) {
                console.log(`Search query error: ${jsonResponse.error.message}`);
            } else {
                return [];
            }
        });
    },

    savePlaylist: async function(playlistName, playlistTracks) {
        if (!playlistName || !playlistTracks || playlistTracks.length === 0) {
            return;
        }

        let access_token = await this.getAccessToken();
        if (!access_token) {
            console.log('No access token available.');
            return;
        }

        const headers = {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };
        const user_id = await fetch('https://api.spotify.com/v1/me', {
            headers: headers
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            console.log('Query error - User ID');
        }, networkError => 
        console.log(networkError.message)
        ).then(jsonResponse => {
            if (jsonResponse && jsonResponse.id) {
                return jsonResponse.id;
            } else if (jsonResponse && jsonResponse.error) {
                console.log(`Query error - User ID: ${jsonResponse.error.message}`);
            }
        });

        if (!user_id) {
            return;
        }

        const playlist_id = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({name: playlistName})
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            console.log(`Error creating playlist ${playlistName}.`);
        }, networkError => 
        console.log(networkError.message)
        ).then(jsonResponse => {
            if (jsonResponse && jsonResponse.id) {
                return jsonResponse.id;
            } else if (jsonResponse && jsonResponse.error) {
                console.log(`Error creating playlist ${playlistName}: ${jsonResponse.error.message}`);
            }
        });

        if (!playlist_id) {
            return;
        }

        const snap_id = await fetch(`https://api.spotify.com/v1/users/${user_id}/playlists/${playlist_id}/tracks?`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({uris: playlistTracks})
        }).then(response => {
            if (response.ok) {
                return response.json();
            }
            console.log(`Error saving playlist ${playlistName}.`);
        }, networkError => 
        console.log(networkError.message)
        ).then(jsonResponse => {
            if (jsonResponse && jsonResponse.snap_id) {
                return jsonResponse.snap_id;
            } else if (jsonResponse && jsonResponse.error) {
                console.log(`Error saving playlist ${playlistName}: ${jsonResponse.error.message}`);
            }
        });

        if (!snap_id) {
            return;
        }
    }
}

export { Spotify };