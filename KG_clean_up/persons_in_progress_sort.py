import json
import os

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


seen_names = set()
unique_list = []
duplicates = []

for entry in identifier_givenname:
    given_name = entry.get('givenName')
    if given_name in seen_names:
        duplicates.append(entry)
    else:
        seen_names.add(given_name)
        unique_list.append(entry)

# print("Found duplicates:")
# for duplicate in duplicates:
#    print(duplicate)

duplicates_list = []

for entry in identifier_givenname:
    givenn = entry.get('givenName')
    for items in unique_list:
        givenname = items.get('givenName', 'Unknown')
        if givenn == givenname:
            duplicates_list.append(entry)


def unique_dicts(data_list):
    seen = set()
    unique_data = []
    for d in data_list:
        entry_tuple = tuple(d.items())
        if entry_tuple not in seen:
            seen.add(entry_tuple)
            unique_data.append(d)
    return unique_data


# print("Found list of duplicates:")
# for dupl in duplicates_list:
#    print(dupl)
sorted_data = sorted(duplicates_list, key=lambda x: x['givenName'])
# for entry in sorted_data:
#    print(entry)
# with open('only_given_name_duplicates.json', 'w', encoding='utf-8') as f:
#    json.dump(sorted_data, f, indent=4)

with open('only_given_name_duplicates.json', 'w', encoding='utf-8') as file:
    json.dump(sorted_data, file, ensure_ascii=False, indent=4)

seen_fullnames = set()
duplicates_fullnames = []

for person in identifier_fullname:
    given_name_person = person.get('givenName', 'Unknown')
    family_name_person = person.get('familyName', 'Unknown')
    name_tuple = (given_name_person, family_name_person)
    if name_tuple in seen_fullnames:
        duplicates_fullnames.append(person)
    else:
        seen_fullnames.add(name_tuple)
        duplicates_fullnames.append(person)
