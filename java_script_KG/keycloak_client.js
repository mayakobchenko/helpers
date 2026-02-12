import Keycloak from "keycloak-js";

// We start by configuring the Keycloak javascript client
// It needs to know your app id in order to authenticate users for it
const keycloak = new Keycloak({
  url: "https://iam.ebrains.eu/auth",
  realm: "hbp",
  clientId: "ebrains-wizard-dev",
});

const YOUR_APP_SCOPES = "team email profile" // full list at https://iam.ebrains.eu/auth/realms/hbp/.well-known/openid-configuration

/**
 * Initialize Keycloak and then call the provided main function with the keycloak instance.
 * @param {Function} main - function to call when authenticated; receives the keycloak instance
 */
function initAuth(main) {
  console.log("DOM content is loaded, initialising Keycloak client...")
  keycloak
    .init({ flow: "implicit" })
    .then(() => checkAuth(main))
    .catch(console.log);
}

/**
 * Verify authentication and either call main(keycloak) or trigger login.
 * @param {Function} main
 */
function checkAuth(main) {
  console.log("Keycloak client is initialised, verifying authentication...");
  const login = (scopes) => keycloak.login({ scope: scopes });

  if (keycloak.authenticated) {
    console.log("Already authenticated, starting app...");
    return main(keycloak);
  } else {
    console.log("Not authenticated, starting login...");
    return login(YOUR_APP_SCOPES);
  }
}

export { initAuth }
