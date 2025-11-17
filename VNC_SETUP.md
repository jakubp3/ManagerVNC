# VNC Integration Notes

## Current Implementation

The application uses noVNC embedded via iframe to provide web-based VNC access. The VNC connection parameters (host, port, password) are passed as URL parameters to the noVNC client.

## noVNC Container

The current setup uses `theasp/novnc:latest` Docker image. This is a basic noVNC installation that may need configuration adjustments.

### URL Format

The frontend generates noVNC URLs in this format:
```
http://localhost:6080/vnc.html?host=HOST&port=PORT&password=PASSWORD&autoconnect=true&resize=scale&reconnect=true
```

### Potential Issues

1. **Direct Connection**: The current setup assumes noVNC can connect directly to VNC servers. This may not work if:
   - VNC servers are behind firewalls
   - Network restrictions prevent direct connections
   - CORS issues with the iframe

2. **Password Handling**: VNC passwords are passed as URL parameters, which is visible in browser history and logs. For production, consider:
   - Using a VNC proxy with authentication
   - Implementing server-side password handling
   - Using WebSocket connections with proper encryption

## Alternative: Custom noVNC + websockify Setup

For production, consider setting up a custom noVNC installation with websockify:

### Option 1: Use websockify as a proxy

```yaml
# docker-compose.yml addition
websockify:
  image: theasp/websockify:latest
  ports:
    - "6081:6080"
  command: ["--target-config=/config/vnc_tokens"]
```

### Option 2: Custom noVNC container

Create a custom Dockerfile that combines noVNC with websockify:

```dockerfile
FROM theasp/novnc:latest
# Add websockify configuration
# Configure proxy settings
```

### Option 3: Backend VNC Proxy

Implement a backend service that:
1. Receives VNC connection requests
2. Validates user permissions
3. Proxies connections to VNC servers
4. Manages WebSocket connections securely

## Testing VNC Connections

1. **Verify VNC Server**: Ensure your VNC server is running and accessible
   ```bash
   # Test VNC connection
   vncviewer HOST:PORT
   ```

2. **Check Network**: Ensure the noVNC container can reach VNC servers
   ```bash
   docker compose exec novnc ping VNC_HOST
   ```

3. **Browser Console**: Check browser console for connection errors

4. **noVNC Logs**: Check noVNC container logs
   ```bash
   docker compose logs novnc
   ```

## Production Recommendations

1. **Use a VNC Proxy**: Implement websockify or similar proxy
2. **Secure Passwords**: Store VNC passwords in a vault (e.g., HashiCorp Vault)
3. **HTTPS**: Use HTTPS for the entire application
4. **Network Security**: 
   - Use VPN or private networks
   - Implement firewall rules
   - Restrict VNC server access
5. **Authentication**: Add additional authentication layer for VNC access
6. **Monitoring**: Log VNC connection attempts and failures
7. **Rate Limiting**: Implement rate limiting on VNC connections

## Troubleshooting

### Connection Refused

- Check if VNC server is running
- Verify host and port are correct
- Check firewall rules
- Ensure network connectivity

### Authentication Failed

- Verify VNC password is correct
- Check if VNC server requires authentication
- Try connecting with a VNC client directly

### CORS Errors

- Configure CORS in noVNC container
- Use a proxy instead of direct connection
- Adjust iframe sandbox attributes

### Iframe Blocked

- Check browser console for errors
- Verify iframe sandbox permissions
- Ensure noVNC allows embedding

## Modifying VNC Integration

To change the VNC integration:

1. **Update VncTab Component** (`frontend/src/components/VncTab.tsx`):
   - Modify the `novncUrl` generation
   - Change URL parameters
   - Adjust iframe configuration

2. **Update Docker Compose** (`docker-compose.yml`):
   - Change noVNC image
   - Add websockify service
   - Configure networking

3. **Backend Proxy** (if implementing):
   - Create VNC proxy service
   - Add WebSocket handling
   - Implement connection management

## Resources

- [noVNC Documentation](https://github.com/novnc/noVNC)
- [websockify](https://github.com/novnc/websockify)
- [VNC Protocol](https://en.wikipedia.org/wiki/Virtual_Network_Computing)

