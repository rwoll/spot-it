import https from 'https';
import querystring from 'querystring';
import config from '../config';
import url from 'url';
import path from 'path';

const search = (trackName) => new Promise((resolve, reject) => {
  let search = {
    type: 'track',
    q: trackName,
    limit: config.SEARCH_LIMIT
  };

  let options = {
    hostname: 'api.spotify.com',
    port: 443,
    path: `/v1/search?${querystring.stringify(search)}`,
    method: 'GET',
    withCredentials: false
  };

  let req = https.request(options, (res) => {
    if (res.statusCode !== 200) {
      reject(`Expected status OK, but got: ${res.statusCode}`);
      return;
    }

    let body = '';
    res.on('data', (d) => {
      body += d;
    });

    res.on('end', () => resolve(JSON.parse(body)['tracks']['items'].map(item => {

      let albumURL = url.format({
        pathname: path.join(__dirname, 'defaultAlbumCover.png'),
        protocol: 'file:',
        slashes: true
      });

      if (item.album.images.length) {
        albumURL = item.album.images[0]['url'];
      }

      return {
        spotifyID: item.id,
        name: item.name,
        artists: item.artists.map(artist => artist.name),
        albumTitle: item.album.name || 'No Album Name',
        albumURL: albumURL
      };
    }
  )))
  });

  req.end();

  req.on('error', (e) => reject(e));
});

export default search
