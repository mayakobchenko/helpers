import requests
import json

# Configuration
# 'https://wiki-int.ebrains.eu/rest/v1/oidc/clients'
API = 'https://wiki.ebrains.eu/rest/v1/oidc/clients'
# "ebrains-wizard-dev"  "restricted-access-email"
clientId = "ebrains-wizard-dev"
# copy paste personal token from the kg editor
bearer_token = "personal token"

try:
    response = requests.get(
        f'{API}/{clientId}',
        headers={'Authorization': f'Bearer {bearer_token}'},
        timeout=30
    )
    response.raise_for_status()
    ebrainsClientResponse = response.json()
    print(json.dumps(ebrainsClientResponse, indent=4))
except requests.exceptions.HTTPError as e:
    print("HTTP error:", response.status_code, response.content)
except requests.exceptions.RequestException as e:
    print("Request failed:", e)
except json.JSONDecodeError:
    print("Response was not valid JSON:", response.text)
