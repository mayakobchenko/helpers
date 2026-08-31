import sys
import json
import requests as rq

# ── configuration ─────────────────────────────────────────────────────────────
# Run as: python cleanup_duplicates.py <personal_token> <dsv_id>
# first run with default, DRY_RUN = True
# then DRY_RUN = False

if len(sys.argv) < 3:
    print("Usage: python cleanup_duplicates.py <personal_token> <dsv_id>")
    sys.exit(1)

personal_token = sys.argv[1]
dsv_id = sys.argv[2]

KG_API = 'https://core.kg.ebrains.eu/v3/instances/'
V = "https://openminds.om-i.org/props/"
T = "https://openminds.om-i.org/types/"

HEADERS = {
    "accept":        "*/*",
    "Authorization": "Bearer " + personal_token,
    "Content-Type":  "application/json; charset=utf-8"
}

DRY_RUN = False   # ← set to False to actually delete

print(f"{'[DRY RUN] ' if DRY_RUN else ''}Cleaning up duplicates in collab-d-{dsv_id}")
print("=" * 70)

# ── fetch all instances of a given type from the collab space ─────────────────


def fetch_all_instances(type_name):
    instances = []
    from_offset = 0
    page_size = 100

    while True:
        url = (
            f"https://core.kg.ebrains.eu/v3/instances"
            f"?stage=IN_PROGRESS"
            f"&space=collab-d-{dsv_id}"
            f"&type=https://openminds.om-i.org/types/{type_name}"
            f"&size={page_size}"
            f"&from={from_offset}"
        )
        resp = rq.get(url=url, headers=HEADERS)
        if not resp.ok:
            print(
                f"ERROR fetching {type_name}: {resp.status_code} {resp.text[:200]}")
            break

        body = resp.json()
        items = body.get("data", [])
        instances.extend(items)

        print(
            f"  fetched {len(instances)}/{body.get('total', '?')} {type_name} instances…")

        if len(items) < page_size:
            break
        from_offset += page_size

    return instances

# ── delete a single instance ──────────────────────────────────────────────────


def delete_instance(instance_url, label):
    uuid = instance_url.split("/")[-1]
    url = f"{KG_API}{uuid}?space=collab-d-{dsv_id}"

    if DRY_RUN:
        print(f"  [DRY RUN] would DELETE {instance_url}  ({label})")
        return True

    resp = rq.delete(url=url, headers=HEADERS)
    if resp.ok:
        print(f"  DELETED {instance_url}  ({label})")
        return True
    else:
        print(
            f"  ERROR deleting {instance_url}: {resp.status_code} {resp.text[:200]}")
        return False

# ── find and remove duplicates for a given type ───────────────────────────────


def cleanup_duplicates(type_name):
    print(f"\nFetching {type_name}...")
    instances = fetch_all_instances(type_name)
    print(f"Total {type_name} instances found: {len(instances)}")

    vocab_label = f"{V}lookupLabel"
    vocab_revision = "https://core.kg.ebrains.eu/vocab/meta/revision"

    # group by lookupLabel
    by_label = {}
    for item in instances:
        label = item.get(vocab_label, "")
        if not label:
            # no lookupLabel — skip (not our instances)
            continue
        if label not in by_label:
            by_label[label] = []
        by_label[label].append(item)

    duplicates_found = 0
    duplicates_deleted = 0

    for label, items in by_label.items():
        if len(items) <= 1:
            continue

        duplicates_found += 1
        print(f"\n  DUPLICATE: '{label}' has {len(items)} instances:")

        # sort by revision string — the revision encodes a counter
        # format is like "_lILbWWS--A" where the suffix increments
        # we keep the one with the latest revision (alphabetically last)
        # and delete the rest
        sorted_items = sorted(
            items,
            key=lambda x: x.get(vocab_revision, ""),
            reverse=True   # latest revision first
        )

        keep = sorted_items[0]
        delete = sorted_items[1:]

        print(
            f"    KEEP:   {keep['@id']}  (rev: {keep.get(vocab_revision, 'unknown')})")
        for item in delete:
            print(
                f"    DELETE: {item['@id']}  (rev: {item.get(vocab_revision, 'unknown')})")
            success = delete_instance(item["@id"], label)
            if success:
                duplicates_deleted += 1

    print(f"\n{type_name} summary:")
    print(f"  duplicate groups found:    {duplicates_found}")
    print(
        f"  instances {'would be ' if DRY_RUN else ''}deleted: {duplicates_deleted}")
    return duplicates_deleted

# ── run cleanup ───────────────────────────────────────────────────────────────


print("\n--- Step 1: Clean up SubjectState duplicates ---")
deleted_states = cleanup_duplicates("SubjectState")

print("\n--- Step 2: Clean up Subject duplicates ---")
deleted_subjects = cleanup_duplicates("Subject")

print("\n--- Step 3: Clean up TissueSampleState duplicates ---")
deleted_tissue_states = cleanup_duplicates("TissueSampleState")

print("\n--- Step 4: Clean up TissueSample duplicates ---")
deleted_tissue_samples = cleanup_duplicates("TissueSample")

print("\n" + "=" * 70)
print(f"{'[DRY RUN] ' if DRY_RUN else ''}TOTAL instances {'to be ' if DRY_RUN else ''}deleted:")
print(f"  SubjectStates:      {deleted_states}")
print(f"  Subjects:           {deleted_subjects}")
print(f"  TissueSampleStates: {deleted_tissue_states}")
print(f"  TissueSamples:      {deleted_tissue_samples}")

if DRY_RUN:
    print("\nThis was a DRY RUN — nothing was deleted.")
    print("Set DRY_RUN = False in the script to perform the actual cleanup.")
