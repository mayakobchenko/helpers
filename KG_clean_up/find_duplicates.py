import json
import os

file_path = os.path.join(os.path.dirname(
    __file__), '../data/kg-instances/Person_in_progress.json')
with open(file_path, 'r', encoding='utf-8') as file:
    data = json.load(file)

seen_names = set()
duplicates = []


# print(type(data))
# print(type(data[0]))
# print(data[0])

for entry in data:
    # Will return None if not found
    given_name = entry.get('givenName', 'Unknown')
    # Default to 'Unknown' if not found
    family_name = entry.get('familyName', 'Unknown')
    name_tuple = (given_name, family_name)
    if name_tuple in seen_names:
        duplicates.append(entry)
    else:
        seen_names.add(name_tuple)

# print("Found duplicates:")
# for duplicate in duplicates:
#    print(duplicate)

duplicates_list = []

for entry in data:
    givenn = entry.get('givenName', 'Unknown')
    familyn = entry.get('familyName', 'Unknown')
    for items in duplicates:
        givenname = items.get('givenName', 'Unknown')
        familyname = items.get('familyName', 'Unknown')
        if givenn == givenname and familyn == familyname:
            duplicates_list.append(entry)


print("Found list of duplicates:")
for dupl in duplicates_list:
    print(dupl)

# sorted_data = sorted(duplicates_list, key=lambda x: x['familyName'])

# Print the sorted list
# print("Sorted by familyName:")
# for entry in sorted_data:
#    print(entry)

file_name = 'duplicates_in_progress.json'
with open(file_name, 'w', encoding='utf-8') as json_file:
    json.dump(duplicates_list, json_file, ensure_ascii=False, indent=3)
