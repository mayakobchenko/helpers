"""
cleanup_duplicates.py — remove specimen/contribution records for a
DatasetVersion before a clean resubmission.

Background: a concurrent double-submission (fixed since — see the
concurrency guard in pythonKGupload.js) caused several entity types that
had no existence check at the time (SubjectGroup, TissueSampleCollection,
and possibly Subject/TissueSampleState under a simultaneous DNS outage) to
be created twice. Manually finding and deleting exactly the duplicate half
in the KG UI is impractical at this scale. This script takes the more
reliable approach: wipe every specimen/contribution record tied to this
DatasetVersion (not the DatasetVersion or Dataset themselves, and NOT
Person/ORCID records — those are shared/reusable and not part of the
duplication bug), then resubmit the corrected JSON fresh with
python_upload_json.py, which recreates everything correctly with the
existence checks now in place.

SAFETY: this is destructive. It only LISTS what it would delete by
default. Nothing is deleted unless you pass --confirm.

Usage:
    python3 cleanup_duplicates.py "token" "json_file_path"            # dry run
    python3 cleanup_duplicates.py "token" "json_file_path" --confirm  # actually delete
"""
import sys
import json
import time
import requests as rq

KG_API = 'https://core.kg.ebrains.eu/v3/instances/'
V = "https://openminds.om-i.org/props/"
T = "https://openminds.om-i.org/types/"

# ── argument parsing ──────────────────────────────────────────────────────────

if len(sys.argv) < 3:
    print(
        "Usage: python3 cleanup_duplicates.py <token> <json_file_path> [--confirm]")
    sys.exit(1)

personal_token = sys.argv[1]
json_file_path = sys.argv[2]
CONFIRM = "--confirm" in sys.argv[3:]

if not personal_token or personal_token in ("null", "undefined"):
    print(json.dumps({"error": "No working token provided."}))
    sys.exit(1)

try:
    with open(json_file_path, 'r') as f:
        data = json.load(f)
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

dsv_id = data.get("datasetVersionId", "")
if not dsv_id:
    print(json.dumps({"error": "datasetVersionId is missing from form data"}))
    sys.exit(1)

SPACE = f"collab-d-{dsv_id}"
HEADERS = {"accept": "*/*", "Authorization": "Bearer " + personal_token}
HEADERS_JSON = {**HEADERS, "Content-Type": "application/json; charset=utf-8"}

print(f"Target DatasetVersion: {dsv_id}", file=sys.stderr)
print(f"Target space:          {SPACE}", file=sys.stderr)
print(
    f"Mode:                  {'DELETE (--confirm passed)' if CONFIRM else 'DRY RUN — nothing will be deleted'}", file=sys.stderr)
print(file=sys.stderr)


# ── retry helpers ─────────────────────────────────────────────────────────────

class KGRequestError(Exception):
    pass


def kg_request_with_retry(method, url, max_retries=3, timeout_seconds=15, **kwargs):
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = rq.request(
                method, url=url, timeout=timeout_seconds, **kwargs)
            if resp.ok:
                return resp
            last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
        except (rq.exceptions.ConnectionError, rq.exceptions.Timeout) as e:
            last_error = str(e)
        if attempt < max_retries:
            backoff = 2 * attempt
            print(
                f"  retry {attempt}/{max_retries} after: {last_error} (waiting {backoff}s)", file=sys.stderr)
            time.sleep(backoff)
    raise KGRequestError(
        f"{method} failed after {max_retries} attempts: {last_error} (url: {url})")


def list_all_instances(type_name):
    """Return a list of @id strings for every instance of type_name in SPACE."""
    ids = []
    from_offset = 0
    page_size = 100
    while True:
        url = (
            f"https://core.kg.ebrains.eu/v3/instances"
            f"?stage=IN_PROGRESS&space={SPACE}"
            f"&type={T}{type_name}"
            f"&size={page_size}&from={from_offset}"
        )
        resp = kg_request_with_retry("GET", url, headers=HEADERS)
        items = resp.json().get("data", [])
        ids.extend(item["@id"] for item in items)
        if len(items) < page_size:
            break
        from_offset += page_size
    return ids


def kg_delete(instance_url):
    instance_uuid = instance_url.split("/")[-1]
    url = f"{KG_API}{instance_uuid}?space={SPACE}"
    return kg_request_with_retry("DELETE", url, headers=HEADERS)


def kg_patch(instance_url, attr):
    instance_uuid = instance_url.split("/")[-1]
    url = f"{KG_API}{instance_uuid}?space={SPACE}"
    payload = {"@context": {"@vocab": V}, **attr}
    return kg_request_with_retry("PATCH", url, headers=HEADERS_JSON, data=json.dumps(payload))


# ── plan ────────────────────────────────────────────────────────────────────
# Deletion order matters: delete referencing entities before the entities
# they reference, so nothing is left pointing at an already-deleted record.
#   1. Clear DatasetVersion.studiedSpecimen / otherContribution first — the
#      top-level entity that references everything else.
#   2. Subject, TissueSample — these reference SubjectGroup/
#      TissueSampleCollection (via isPartOf) and their own State.
#   3. SubjectGroup, TissueSampleCollection — now nothing points to them.
#   4. SubjectState, TissueSampleState — now nothing points to them either,
#      since step 2/3 removed everything that referenced them.
#   5. Contribution — referenced only by DatasetVersion, already cleared.

DELETION_ORDER = [
    "Subject",
    "TissueSample",
    "SubjectGroup",
    "TissueSampleCollection",
    "SubjectState",
    "TissueSampleState",
    "Contribution",
]

results = {"space": SPACE, "dsv_id": dsv_id,
           "mode": "delete" if CONFIRM else "dry_run", "deleted": {}, "errors": []}

# ── step 1: clear DatasetVersion references ───────────────────────────────────
dsv_url = f"https://kg.ebrains.eu/api/instances/{dsv_id}"
print(f"=== Step 1: clear DatasetVersion.studiedSpecimen / otherContribution ===", file=sys.stderr)
if CONFIRM:
    try:
        kg_patch(dsv_url, {"studiedSpecimen": [], "otherContribution": []})
        print("  cleared.", file=sys.stderr)
    except KGRequestError as e:
        print(f"  FAILED: {e}", file=sys.stderr)
        results["errors"].append(
            {"step": "clear_dsv_references", "error": str(e)})
        print(json.dumps(results))
        sys.exit(1)  # don't proceed to delete children while still referenced
else:
    print("  (dry run — would clear studiedSpecimen and otherContribution)", file=sys.stderr)
print(file=sys.stderr)

# ── steps 2-5: delete each type in order ───────────────────────────────────────
for type_name in DELETION_ORDER:
    print(f"=== {type_name} ===", file=sys.stderr)
    try:
        ids = list_all_instances(type_name)
    except KGRequestError as e:
        print(f"  FAILED to list: {e}", file=sys.stderr)
        results["errors"].append(
            {"type": type_name, "step": "list", "error": str(e)})
        continue

    print(f"  found {len(ids)} instance(s)", file=sys.stderr)
    deleted_count = 0
    for instance_id in ids:
        if CONFIRM:
            try:
                kg_delete(instance_id)
                deleted_count += 1
            except KGRequestError as e:
                print(
                    f"  FAILED to delete {instance_id}: {e}", file=sys.stderr)
                results["errors"].append(
                    {"type": type_name, "id": instance_id, "error": str(e)})
        else:
            print(f"  would delete: {instance_id}", file=sys.stderr)

    results["deleted"][type_name] = deleted_count if CONFIRM else len(ids)
    print(file=sys.stderr)

print("=== Summary ===", file=sys.stderr)
for type_name, count in results["deleted"].items():
    label = "deleted" if CONFIRM else "would delete"
    print(f"  {type_name}: {count} {label}", file=sys.stderr)
if results["errors"]:
    print(
        f"  {len(results['errors'])} error(s) — see details below", file=sys.stderr)

print(json.dumps(results))
