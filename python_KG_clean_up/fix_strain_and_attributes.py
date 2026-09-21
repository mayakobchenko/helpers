"""
One-off fix script for dataset version 66a333f2-0af8-4793-adb8-c227d57527c7.

Applies four changes to every relevant entity that's actually part of this
dataset RIGHT NOW (discovered live from the KG via DatasetVersion.studiedSpecimen
— NOT from any locally saved wizard JSON, since that export is known to be
stale: it still lists TissueSampleCollections that have since been deleted):

  1. Replaces strain C57BL/6 (bb67689f-dbfa-463b-88dd-f126ae8158fa)
     with     strain C57BL/6J (96886288-ff62-4aa7-b827-b7fded61cb00)
     on every SubjectGroup, Subject, and TissueSample.
     (TissueSampleCollection is deliberately skipped if any is somehow
     still found — they're not supposed to exist in this dataset anymore.)

  2. Adds anatomicalLocation = hippocampus CA1 pyramidal neuron to every
     individual TissueSample.

  3. Adds attribute = free floating to every TissueSample's TissueSampleState(s).

  4. Adds attribute = deceased to every Subject's SubjectState(s).

SAFETY: dry-run by default — prints every planned change, writes nothing.
Pass --confirm to actually apply the changes.

Usage:
    python fix_strain_and_attributes.py <token>              # dry run
    python fix_strain_and_attributes.py <token> --confirm    # live run
"""
import sys
import json
import time
import argparse
import requests as rq

# ── KG conventions — copied verbatim from python_upload_json.py rather than
# reimplemented, since getting the @context / property-name convention or
# the ?space= parameter subtly wrong would silently corrupt real data ──────

KG_API = 'https://core.kg.ebrains.eu/v3/instances/'
KG_PREFIX = 'https://kg.ebrains.eu/api/instances/'
VOCAB = {"@context": {"@vocab": "https://openminds.om-i.org/props/"}}
V = "https://openminds.om-i.org/props/"   # used when READING (GET responses
T = "https://openminds.om-i.org/types/"  # use fully-expanded property URIs)

DATASET_VERSION_ID = "66a333f2-0af8-4793-adb8-c227d57527c7"

OLD_STRAIN = KG_PREFIX + "bb67689f-dbfa-463b-88dd-f126ae8158fa"  # C57BL/6
NEW_STRAIN = KG_PREFIX + "96886288-ff62-4aa7-b827-b7fded61cb00"  # C57BL/6J

# ── NEEDS CONFIRMATION ──────────────────────────────────────────────────────

DECEASED_ATTRIBUTE = KG_PREFIX + "aa7e62c5-5f03-4015-b66e-e9c0e04e2303"
# TissueSampleAttribute "free floating"
FREE_FLOATING_ATTRIBUTE = KG_PREFIX + "d66e762f-7ecf-4eee-be45-a67ffb5d8c5b"
# anatomicalLocation "hippocampus CA1 pyramidal neuron"
HIPPOCAMPUS_CA1_LOCATION = KG_PREFIX + "499b52ed-fb94-4291-a4fd-99a043a9af31"


# ── low-level KG helpers (mirrors python_upload_json.py exactly) ───────────

def kg_get_with_retry(url, headers, max_retries=3, timeout_seconds=15):
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = rq.get(url=url, headers=headers, timeout=timeout_seconds)
            if resp.ok:
                return resp
            last_error = f"HTTP {resp.status_code}: {resp.text[:200]}"
        except (rq.exceptions.ConnectionError, rq.exceptions.Timeout) as e:
            last_error = str(e)
        if attempt < max_retries:
            backoff = 2 * attempt
            print(
                f"DEBUG GET attempt {attempt}/{max_retries} failed ({last_error}) — retrying in {backoff}s", file=sys.stderr)
            time.sleep(backoff)
    raise RuntimeError(
        f"KG GET failed after {max_retries} attempts: {last_error} (url: {url})")


def get_instance(uuid, token):
    headers = {"accept": "*/*", "Authorization": "Bearer " + token}
    resp = kg_get_with_retry(f"{KG_API}{uuid}?stage=IN_PROGRESS", headers)
    return resp.json().get("data", {})


def kg_patch(entry_id, attr, token, dsv_id, dry_run):
    instance_uuid = entry_id.rstrip("/").split("/")[-1]
    if dry_run:
        print(f"  [DRY RUN] would PATCH {instance_uuid}: {json.dumps(attr)}")
        return True
    payload = {**VOCAB, **attr}
    headers = {
        "accept": "*/*",
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json; charset=utf-8",
    }
    url = f"{KG_API}{instance_uuid}?space=collab-d-{dsv_id}"
    resp = rq.patch(url=url, headers=headers,
                    data=json.dumps(payload, indent=4))
    print(f"DEBUG PATCH {url} -> {resp.status_code}", file=sys.stderr)
    if not resp.ok:
        print(
            f"  ERROR patching {instance_uuid}: {resp.status_code} {resp.text[:300]}")
        return False
    return True


def short_id(ref):
    if isinstance(ref, dict):
        ref = ref.get("@id", "")
    return (ref or "").rstrip("/").split("/")[-1]


def as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


# ── task-specific logic ─────────────────────────────────────────────────────

def fix_strain(uuid, node, label, token, dsv_id, dry_run, stats):
    current = node.get(f"{V}strain")
    current_id = current.get("@id") if isinstance(current, dict) else None
    if current_id == OLD_STRAIN:
        ok = kg_patch(uuid, {"strain": {"@id": NEW_STRAIN}},
                      token, dsv_id, dry_run)
        print(f"{'[DRY RUN] ' if dry_run else ''}strain: {label} ({uuid}) C57BL/6 -> C57BL/6J {'OK' if ok else 'FAILED'}")
        stats["strain_fixed" if ok else "strain_failed"] += 1
    elif current_id == NEW_STRAIN:
        print(f"  already C57BL/6J: {label} ({uuid}) — skipping")
        stats["strain_already_ok"] += 1
    elif current_id:
        print(
            f"  UNEXPECTED strain on {label} ({uuid}): {current_id} — leaving untouched, please check manually")
        stats["strain_unexpected"] += 1
    else:
        print(f"  no strain set on {label} ({uuid}) — nothing to fix")
        stats["strain_missing"] += 1


def add_state_attribute(state_uuid, label, attribute_id, token, dsv_id, dry_run, stats):
    state = get_instance(state_uuid, token)
    existing_ids = [short_id(e) for e in as_list(state.get(f"{V}attribute"))]
    target_short = short_id(attribute_id)
    if target_short in existing_ids:
        print(
            f"  attribute already present on {label} state ({state_uuid}) — skipping")
        stats["attr_already_ok"] += 1
        return
    new_ids = existing_ids + [target_short]
    ok = kg_patch(state_uuid, {"attribute": [
                  {"@id": KG_PREFIX + i} for i in new_ids]}, token, dsv_id, dry_run)
    print(f"{'[DRY RUN] ' if dry_run else ''}attribute add: {label} state ({state_uuid}) {'OK' if ok else 'FAILED'}")
    stats["attr_fixed" if ok else "attr_failed"] += 1


def add_anatomical_location(uuid, node, label, token, dsv_id, dry_run, stats):
    existing_ids = [short_id(e) for e in as_list(
        node.get(f"{V}anatomicalLocation"))]
    target_short = short_id(HIPPOCAMPUS_CA1_LOCATION)
    if target_short in existing_ids:
        print(
            f"  anatomicalLocation already present on {label} ({uuid}) — skipping")
        stats["anat_already_ok"] += 1
        return
    new_ids = existing_ids + [target_short]
    ok = kg_patch(uuid, {"anatomicalLocation": [
                  {"@id": KG_PREFIX + i} for i in new_ids]}, token, dsv_id, dry_run)
    print(f"{'[DRY RUN] ' if dry_run else ''}anatomicalLocation add: {label} ({uuid}) {'OK' if ok else 'FAILED'}")
    stats["anat_fixed" if ok else "anat_failed"] += 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("token")
    parser.add_argument("--confirm", action="store_true",
                        help="Actually write changes. Without this, only prints what WOULD happen.")
    args = parser.parse_args()
    dry_run = not args.confirm

    if args.confirm and (FREE_FLOATING_ATTRIBUTE.endswith("REPLACE_ME") or HIPPOCAMPUS_CA1_LOCATION.endswith("REPLACE_ME")):
        print("ERROR: fill in FREE_FLOATING_ATTRIBUTE and HIPPOCAMPUS_CA1_LOCATION at the top of this "
              "script before running with --confirm. (Dry runs will still work and will flag these lines.)")
        sys.exit(1)

    stats = {k: 0 for k in [
        "strain_fixed", "strain_failed", "strain_already_ok", "strain_unexpected", "strain_missing",
        "attr_fixed", "attr_failed", "attr_already_ok",
        "anat_fixed", "anat_failed", "anat_already_ok",
        "skipped_collections", "skipped_unrecognized",
    ]}

    print("=" * 70)
    print("DRY RUN — no changes will be written" if dry_run else "LIVE RUN — changes WILL be written to the KG")
    print("=" * 70)
    if not dry_run and (FREE_FLOATING_ATTRIBUTE.endswith("REPLACE_ME") or HIPPOCAMPUS_CA1_LOCATION.endswith("REPLACE_ME")):
        pass  # already exited above; kept here for clarity of intent
    print()

    dsv = get_instance(DATASET_VERSION_ID, args.token)
    specimen_refs = as_list(dsv.get(f"{V}studiedSpecimen"))
    print(
        f"Found {len(specimen_refs)} specimen(s) currently linked to this dataset version.\n")

    for ref in specimen_refs:
        uuid = short_id(ref)
        node = get_instance(uuid, args.token)
        types = node.get("@type") or []
        label = node.get(f"{V}lookupLabel", uuid)

        if f"{T}SubjectGroup" in types:
            print(f"[SubjectGroup] {label}")
            fix_strain(
                uuid, node, f"SubjectGroup {label}", args.token, DATASET_VERSION_ID, dry_run, stats)

        elif f"{T}Subject" in types:
            print(f"[Subject] {label}")
            fix_strain(
                uuid, node, f"Subject {label}", args.token, DATASET_VERSION_ID, dry_run, stats)
            for st_ref in as_list(node.get(f"{V}studiedState")):
                add_state_attribute(short_id(st_ref), f"Subject {label}", DECEASED_ATTRIBUTE,
                                    args.token, DATASET_VERSION_ID, dry_run, stats)

        elif f"{T}TissueSample" in types:
            print(f"[TissueSample] {label}")
            fix_strain(
                uuid, node, f"TissueSample {label}", args.token, DATASET_VERSION_ID, dry_run, stats)
            add_anatomical_location(
                uuid, node, f"TissueSample {label}", args.token, DATASET_VERSION_ID, dry_run, stats)
            for st_ref in as_list(node.get(f"{V}studiedState")):
                add_state_attribute(short_id(st_ref), f"TissueSample {label}", FREE_FLOATING_ATTRIBUTE,
                                    args.token, DATASET_VERSION_ID, dry_run, stats)

        elif f"{T}TissueSampleCollection" in types:
            print(f"[TissueSampleCollection] {label} ({uuid}) — SKIPPING. Collections are expected to have "
                  f"been removed from this dataset; found one anyway. Leaving it completely untouched — "
                  f"please check manually whether this needs cleanup.")
            stats["skipped_collections"] += 1

        else:
            print(f"[unrecognized type] {uuid}: {types} — skipping")
            stats["skipped_unrecognized"] += 1

        print()

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    for k, v in stats.items():
        print(f"  {k}: {v}")
    if dry_run:
        print("\nThis was a dry run — nothing was written. Re-run with --confirm to apply.")


if __name__ == "__main__":
    main()
