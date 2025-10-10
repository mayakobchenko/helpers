import json
import os

file_path = os.path.join(os.path.dirname(
    __file__), '../data/kg-instances/Person_common.json')
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

seen_names = set()
duplicates = []

print(type(data))
print(type(data[0]))
"""
for entry in data:
    name_tuple = (entry['familyName'], entry['givenName'])
    if name_tuple in seen_names:
        duplicates.append(entry)
    else:
        seen_names.add(name_tuple)

print("Found duplicates:")
for duplicate in duplicates:
    print(duplicate)
"""

for entry in data:
    family_name = entry.get('familyName')  # Will return None if not found
    # Default to 'Unknown' if not found
    given_name = entry.get('givenName', 'Unknown')
    name_tuple = (family_name, given_name)
    if name_tuple in seen_names:
        duplicates.append(entry)
    else:
        seen_names.add(name_tuple)

print("Found duplicates:")
for duplicate in duplicates:
    print(duplicate)

# file_name = 'duplicates.json'
# with open(file_name, 'w', encoding='utf-8') as json_file:
#    json.dump(duplicates, json_file, ensure_ascii=False, indent=3)

duplicates_list = []

for entry in data:
    familyn = entry.get('familyName')
    givenn = entry.get('givenName', 'Unknown')
    for items in duplicates:
        familyname = items.get('familyName')
        givenname = items.get('givenName', 'Unknown')
        if givenn == givenname and familyn == familyname:
            duplicates_list.append(entry)


print("Found list of duplicates:")
for dupl in duplicates_list:
    print(dupl)

sorted_data = sorted(duplicates_list, key=lambda x: x['familyName'])

# Print the sorted list
print("Sorted by familyName:")
for entry in sorted_data:
    print(entry)

file_name = 'duplicates.json'
with open(file_name, 'w', encoding='utf-8') as json_file:
    json.dump(sorted_data, json_file, ensure_ascii=False, indent=3)
