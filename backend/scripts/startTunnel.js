import localtunnel from 'localtunnel';

(async () => {
  try {
    const subdomain = 'mindease-' + Math.random().toString(36).substring(2, 7);
    const tunnel = await localtunnel({ port: 5000, subdomain });
    console.log('==================================================');
    console.log('PUBLIC_TUNNEL_URL: ' + tunnel.url);
    console.log('==================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed');
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to create tunnel:', err);
  }
})();
