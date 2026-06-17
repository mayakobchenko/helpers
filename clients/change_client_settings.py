import requests
import json

# Configuration
API = 'https://wiki.ebrains.eu/rest/v1/oidc/clients'
clientId = "ebrains-wizard-dev"
bearer_token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJLYU01NTRCM2RmMHBIamZYWi1aRl94bUUwMThPS1R0RkNjMjR3aVVqQmFvIn0.eyJleHAiOjE3ODE1MzU4MTksImlhdCI6MTc4MTUzNDAxOSwiYXV0aF90aW1lIjoxNzgxNTI2MTExLCJqdGkiOiJvbnJ0YWM6YmM2Yzc4NDMtOWY2OS04MTI1LWViYTAtMjUxODA0ZGFhYjA2IiwiaXNzIjoiaHR0cHM6Ly9pYW0uZWJyYWlucy5ldS9hdXRoL3JlYWxtcy9oYnAiLCJhdWQiOlsianVweXRlcmh1YiIsInR1dG9yaWFsT2lkY0FwaSIsInh3aWtpIiwianVweXRlcmh1Yi1qc2MiLCJ0ZWFtIiwiZ3JvdXAiXSwic3ViIjoiN2FlYzJiZjItODJjOC00MGMxLWJkNjQtMTczY2FiY2ZkODQyIiwidHlwIjoiQmVhcmVyIiwiYXpwIjoia2ciLCJzaWQiOiJJQm4zcVI2YlRTSlhXT3lLUlN0bjlCWW0iLCJzY29wZSI6InByb2ZpbGUgcm9sZXMgZW1haWwgb3BlbmlkIGdyb3VwIGNsYi53aWtpLnJlYWQgdGVhbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJuYW1lIjoiTWF5YSBLb2JjaGVua28iLCJtaXRyZWlkLXN1YiI6IjIzODA5NDYzMjkyNTU2MTYiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJtYXlha29iY2hlbmtvIiwiZ2l2ZW5fbmFtZSI6Ik1heWEiLCJmYW1pbHlfbmFtZSI6IktvYmNoZW5rbyIsImVtYWlsIjoibWF5YS5rb2JjaGVua29AbWVkaXNpbi51aW8ubm8ifQ.AhbngW4WXMWTaI3Q9y5gqRxuckXl9382E-xxfvTJSeq47u5OY_cN_sR3g2tqZTXoWoCJnNWwYO5EqGmSSOodAVxQk6UEmhAQickryneDvwdB_-yQdA0eOIw0KNQRoVTegO3--Cm9yJKL0nD-1MZCZ_fnZ54tkllocyQcWyPbn20JWyWah6ffMqn9235L76u52lMEOUBFvfO7YPZiwf3mIPEvNQ-xUG-5VTEvObwDMCgf4sw7SJoQyvGvoLkKrc59N5S2C_wMue9btQzfxt7LVvWozCUwfAgBiH5jIf8WkTQRLYUvqiUIwZXyOOB4laFLEmKtyoks_6ThcAz_Pwt5rg"  # paste your token

NEW_REDIRECT_URL = "https://metadata-wizard-dev.apps.dev-jsccloud.ebrains.eu/*"
NEW_ORIGIN = "https://metadata-wizard-dev.apps.dev-jsccloud.ebrains.eu"

# ── Step 1: Fetch current client config ──────────────────────────────────────
print("Fetching current client config...")
response = requests.get(
    f'{API}/{clientId}',
    headers={'Authorization': f'Bearer {bearer_token}'},
    timeout=30
)
response.raise_for_status()
client_data = response.json()

print("Current config:")
print(json.dumps(client_data, indent=4))

# ── Step 2: Add new URLs (only if not already present) ───────────────────────
redirect_uris = client_data['client'].get('redirectUris', [])
web_origins = client_data['client'].get('webOrigins', [])

if NEW_REDIRECT_URL not in redirect_uris:
    redirect_uris.append(NEW_REDIRECT_URL)
    print(f"\n✅ Added redirect URI: {NEW_REDIRECT_URL}")
else:
    print(f"\n⚠️  Redirect URI already present: {NEW_REDIRECT_URL}")

if NEW_ORIGIN not in web_origins:
    web_origins.append(NEW_ORIGIN)
    print(f"✅ Added web origin: {NEW_ORIGIN}")
else:
    print(f"⚠️  Web origin already present: {NEW_ORIGIN}")

client_data['client']['redirectUris'] = redirect_uris
client_data['client']['webOrigins'] = web_origins

# ── Step 3: Push updated config ───────────────────────────────────────────────
print("\nUpdating client config...")
put_response = requests.put(
    f'{API}/{clientId}',
    headers={'Authorization': f'Bearer {bearer_token}'},
    json=client_data,
    timeout=30
)
put_response.raise_for_status()

updated = put_response.json()
print("\n✅ Update successful! New redirect URIs:")
for uri in updated['client'].get('redirectUris', []):
    print(f"  - {uri}")
print("\nNew web origins:")
for origin in updated['client'].get('webOrigins', []):
    print(f"  - {origin}")
