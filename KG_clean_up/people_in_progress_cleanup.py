import json
import os
from collections import defaultdict

file_path = os.path.join(os.path.dirname(
    __file__), '../data/kg-instances/Person_in_progress.json')
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

only_identifier = []
identifier_givenname = []
identifier_familyname = []
identifier_fullname = []
other = []

for entry in data:
    has_identifier = 'identifier' in entry
    has_first_name = 'givenName' in entry
    has_family_name = 'familyName' in entry

    if has_identifier and has_first_name and has_family_name:
        identifier_fullname.append(entry)
    elif has_identifier and has_first_name:
        identifier_givenname.append(entry)
    elif has_identifier and has_family_name:
        identifier_familyname.append(entry)
    elif has_identifier:
        only_identifier.append(entry)
    else:
        other.append(entry)

with open('only_identifier.json', 'w') as f:
    json.dump(only_identifier, f, ensure_ascii=False, indent=4)

with open('identifier_fullname.json', 'w', encoding='utf-8') as f:
    json.dump(identifier_fullname, f, ensure_ascii=False, indent=4)

with open('identifier_familyname.json', 'w', encoding='utf-8') as f:
    json.dump(identifier_familyname, f, ensure_ascii=False, indent=4)

with open('identifier_givenname.json', 'w', encoding='utf-8') as f:
    json.dump(identifier_givenname, f, ensure_ascii=False, indent=4)

with open('other_entries.json', 'w', encoding='utf-8') as f:
    json.dump(other, f, ensure_ascii=False, indent=4)


def find_duplicates(data):
    name_count = defaultdict(int)  # Dictionary to count occurrences
    for entry in data:
        name_key = (entry["givenName"], entry["familyName"])
        name_count[name_key] += 1
    duplicates = [entry for entry in data if name_count[(
        entry["givenName"], entry["familyName"])] > 1]
    return duplicates


duplicate_entries = find_duplicates(identifier_fullname)
sorted_data = sorted(duplicate_entries, key=lambda x: x['givenName'])
with open('fullnames_duplicates.json', 'w', encoding='utf-8') as file:
    json.dump(sorted_data, file, ensure_ascii=False, indent=4)


def find_duplicates_givenname(data_names):
    count = defaultdict(int)
    for item in data_names:
        key = (item["givenName"])
        count[key] += 1
    dupl = [item for item in data_names if count[(item["givenName"])] > 1]
    return dupl


duplicates_firstname = find_duplicates_givenname(identifier_givenname)
sorted_data_firstname = sorted(
    duplicates_firstname, key=lambda x: x['givenName'])
with open('firstname_duplicates.json', 'w', encoding='utf-8') as file:
    json.dump(sorted_data_firstname, file, ensure_ascii=False, indent=4)
