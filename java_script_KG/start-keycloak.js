// start-keycloak.js
import { initAuth } from "./keycloak_client.js"; // the file you converted to JS

// Basic DOM helpers
const statusEl = document.getElementById("status");
const userinfoEl = document.getElementById("userinfo");
const logoutBtn = document.getElementById("logoutBtn");
const tokenBtn = document.getElementById("tokenBtn");

function setStatus(text) {
  statusEl.textContent = text;
}

/**
 * main will be called with the keycloak instance when authenticated
 * @param {any} keycloak
 */
function main(keycloak) {
  setStatus("Authenticated. Loading user info...");

  // Show logout + token buttons
  logoutBtn.style.display = "inline-block";
  tokenBtn.style.display = "inline-block";

  // Handler to display basic user info from token
  function showUserInfo() {
    // tokenParsed contains the decoded JWT claims (if available)
    const parsed = keycloak.tokenParsed || {};
    const info = {
      username: parsed.preferred_username || parsed.username || parsed.sub || "(unknown)",
      name: parsed.name || "(no name)",
      email: parsed.email || "(no email)",
      issuedAt: parsed.iat ? new Date(parsed.iat * 1000).toISOString() : "(no iat)",
      expiresAt: parsed.exp ? new Date(parsed.exp * 1000).toISOString() : "(no exp)",
    };
    userinfoEl.textContent = JSON.stringify(info, null, 2);
  }

  // Show token details on button click
  tokenBtn.addEventListener("click", () => {
    const tokenInfo = {
      token: keycloak.token,
      refreshToken: keycloak.refreshToken,
      tokenParsed: keycloak.tokenParsed,
    };
    alert(JSON.stringify(tokenInfo, null, 2));
  });

  // Logout
  logoutBtn.addEventListener("click", () => {
    // This will redirect the browser to the Keycloak logout endpoint
    keycloak.logout();
  });

  // Run first display
  showUserInfo();

  // Setup periodic token refresh check.
  // keycloak.updateToken(minValidity) returns a Promise that resolves true if token was refreshed
  // minValidity is seconds before expiration to attempt a refresh
  const MIN_VALIDITY = 30; // seconds

  const refreshInterval = setInterval(() => {
    keycloak
      .updateToken(MIN_VALIDITY)
      .then((refreshed) => {
        if (refreshed) {
          console.log("Token was refreshed");
        } else {
          console.log("Token is still valid");
        }
        // update displayed userinfo because tokenParsed may have changed
        showUserInfo();
      })
      .catch((err) => {
        console.warn("Failed to refresh token, forcing login:", err);
        // try to re-authenticate
        keycloak.login();
      });
  }, 1000 * 20); // check every 20s (adjust as desired)

  // Optional: cleanup if you ever unmount
  // return a function to stop the refresh interval if needed
  return () => clearInterval(refreshInterval);
}

// Initialize auth and start main when ready
initAuth(main);

// Optional: show helpful info while loading
setStatus("Waiting for Keycloak init...");
