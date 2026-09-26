"""
DynamoDB single-table repository for Evidence Ledger.

Mirrors docs/DATABASE.md design:
- Table: EvidenceLedger (or from settings)
- PK: CASE#{case_id}
- SK: META, SOURCE#{source_id}, OBS#{observation_id}, FLAG#{flag_id}, LINK#{link_id}, EXPORT#{export_id}, IDEMP#{key_hash}
"""

from __future__ import annotations

import base64
import json
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from evidence_ledger.config import get_dynamodb_resource, get_settings
from evidence_ledger.contracts.models import (
    FIELD_ACTION_TO_STATE,
    CaseSummary,
    Export,
    FieldReview,
    Flag,
    FlagCategory,
    FlagState,
    Link,
    Observation,
    ReviewStatus,
    Source,
)


class RepositoryError(Exception):
    """Base repository exception."""


class EntityNotFoundError(RepositoryError):
    """Raised when an entity is not found in DynamoDB."""


class VersionConflictError(RepositoryError):
    """Raised when optimistic concurrency version check fails."""


class IdempotencyConflictError(RepositoryError):
    """Raised when an idempotent request key already exists."""


def _float_to_decimal(obj: Any) -> Any:
    """Recursively converts float to Decimal for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: _float_to_decimal(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [_float_to_decimal(i) for i in obj]
    return obj


def _decimal_to_float_or_int(obj: Any) -> Any:
    """Recursively converts Decimal back to int or float for Pydantic."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    if isinstance(obj, dict):
        return {k: _decimal_to_float_or_int(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_decimal_to_float_or_int(i) for i in obj]
    return obj


def _encode_cursor(lek: dict[str, Any] | None) -> str | None:
    if not lek:
        return None
    data = json.dumps(_decimal_to_float_or_int(lek))
    return base64.urlsafe_b64encode(data.encode("utf-8")).decode("utf-8")


def _decode_cursor(cursor: str | None) -> dict[str, Any] | None:
    if not cursor:
        return None
    try:
        raw = base64.urlsafe_b64decode(cursor.encode("utf-8")).decode("utf-8")
        return json.loads(raw)
    except Exception:
        return None


class DynamoRepository:
    def __init__(self, table: Any = None) -> None:
        if table is not None:
            self._table = table
        else:
            settings = get_settings()
            dynamo = get_dynamodb_resource()
            self._table = dynamo.Table(settings.dynamodb_table_name)

    # -------------------------------------------------------------------------
    # CASE OPERATIONS
    # -------------------------------------------------------------------------

    def create_case(self, case: CaseSummary) -> CaseSummary:
        pk = f"CASE#{case.case_id}"
        sk = "META"
        item = _float_to_decimal(case.model_dump(mode="json"))
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "case"

        try:
            self._table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(PK)",
            )
            return case
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise VersionConflictError(f"Case {case.case_id} already exists.") from e
            raise RepositoryError(str(e)) from e

    def get_case(self, case_id: str) -> CaseSummary | None:
        pk = f"CASE#{case_id}"
        sk = "META"
        resp = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = resp.get("Item")
        if not item:
            return None
        data = _decimal_to_float_or_int(item)
        data.pop("PK", None)
        data.pop("SK", None)
        data.pop("entity_type", None)
        return CaseSummary.model_validate(data)

    def update_case(self, case: CaseSummary, expected_version: int | None = None) -> CaseSummary:
        pk = f"CASE#{case.case_id}"
        sk = "META"
        now = datetime.now(UTC).isoformat()
        current_version = case.version
        new_version = current_version + 1

        case_data = case.model_dump(mode="json")
        case_data["version"] = new_version
        case_data["updated_at"] = now
        item = _float_to_decimal(case_data)
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "case"

        try:
            if expected_version is not None:
                self._table.put_item(
                    Item=item,
                    ConditionExpression="attribute_exists(PK) AND version = :expected",
                    ExpressionAttributeValues={":expected": expected_version},
                )
            else:
                self._table.put_item(Item=item)
            return CaseSummary.model_validate(case_data)
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise VersionConflictError(
                    f"Case version conflict: expected {expected_version}"
                ) from e
            raise RepositoryError(str(e)) from e

    def delete_case(self, case_id: str) -> None:
        """Deletes all items belonging to case partition."""
        pk = f"CASE#{case_id}"
        resp = self._table.query(KeyConditionExpression=Key("PK").eq(pk))
        items = resp.get("Items", [])
        with self._table.batch_writer() as batch:
            for item in items:
                batch.delete_item(Key={"PK": item["PK"], "SK": item["SK"]})

    # -------------------------------------------------------------------------
    # SOURCE OPERATIONS
    # -------------------------------------------------------------------------

    def put_source(self, source: Source, expected_version: int | None = None) -> Source:
        pk = f"CASE#{source.case_id}"
        sk = f"SOURCE#{source.source_id}"
        now = datetime.now(UTC).isoformat()

        source_data = source.model_dump(mode="json")
        new_version = source.version if expected_version is None else expected_version + 1
        source_data["version"] = new_version
        source_data["updated_at"] = now
        item = _float_to_decimal(source_data)
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "source"

        try:
            if expected_version is not None:
                self._table.put_item(
                    Item=item,
                    ConditionExpression="attribute_exists(PK) AND version = :expected",
                    ExpressionAttributeValues={":expected": expected_version},
                )
            else:
                self._table.put_item(Item=item)
            return Source.model_validate(source_data)
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise VersionConflictError(
                    f"Source version conflict: expected {expected_version}"
                ) from e
            raise RepositoryError(str(e)) from e

    def get_source(self, case_id: str, source_id: str) -> Source | None:
        pk = f"CASE#{case_id}"
        sk = f"SOURCE#{source_id}"
        resp = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = resp.get("Item")
        if not item:
            return None
        data = _decimal_to_float_or_int(item)
        data.pop("PK", None)
        data.pop("SK", None)
        data.pop("entity_type", None)
        return Source.model_validate(data)

    def list_sources(
        self, case_id: str, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Source], str | None]:
        pk = f"CASE#{case_id}"
        query_params: dict[str, Any] = {
            "KeyConditionExpression": Key("PK").eq(pk) & Key("SK").begins_with("SOURCE#"),
            "Limit": limit,
        }
        lek = _decode_cursor(cursor)
        if lek:
            query_params["ExclusiveStartKey"] = _float_to_decimal(lek)

        resp = self._table.query(**query_params)
        items = resp.get("Items", [])
        sources = []
        for item in items:
            data = _decimal_to_float_or_int(item)
            data.pop("PK", None)
            data.pop("SK", None)
            data.pop("entity_type", None)
            sources.append(Source.model_validate(data))

        next_cursor = _encode_cursor(resp.get("LastEvaluatedKey"))
        return sources, next_cursor

    def find_source_by_sha256(self, case_id: str, sha256: str) -> Source | None:
        """Finds any existing source in the case with matching sha256 digest."""
        sources, _ = self.list_sources(case_id, limit=200)
        for s in sources:
            if s.sha256 == sha256:
                return s
        return None

    # -------------------------------------------------------------------------
    # OBSERVATION OPERATIONS
    # -------------------------------------------------------------------------

    def put_observation(self, obs: Observation, expected_version: int | None = None) -> Observation:
        pk = f"CASE#{obs.case_id}"
        sk = f"OBS#{obs.observation_id}"

        obs_data = obs.model_dump(mode="json")
        new_version = obs.version if expected_version is None else expected_version + 1
        obs_data["version"] = new_version
        item = _float_to_decimal(obs_data)
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "observation"

        try:
            if expected_version is not None:
                self._table.put_item(
                    Item=item,
                    ConditionExpression="attribute_exists(PK) AND version = :expected",
                    ExpressionAttributeValues={":expected": expected_version},
                )
            else:
                self._table.put_item(Item=item)
            return Observation.model_validate(obs_data)
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise VersionConflictError(
                    f"Observation version conflict: expected {expected_version}"
                ) from e
            raise RepositoryError(str(e)) from e

    def get_observation(self, case_id: str, observation_id: str) -> Observation | None:
        pk = f"CASE#{case_id}"
        sk = f"OBS#{observation_id}"
        resp = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = resp.get("Item")
        if not item:
            return None
        data = _decimal_to_float_or_int(item)
        data.pop("PK", None)
        data.pop("SK", None)
        data.pop("entity_type", None)
        return Observation.model_validate(data)

    def list_observations(
        self,
        case_id: str,
        source_id: str | None = None,
        review_status: ReviewStatus | None = None,
        event_type: str | None = None,
        limit: int = 100,
        cursor: str | None = None,
    ) -> tuple[list[Observation], str | None]:
        pk = f"CASE#{case_id}"
        query_params: dict[str, Any] = {
            "KeyConditionExpression": Key("PK").eq(pk) & Key("SK").begins_with("OBS#"),
            "Limit": limit,
        }
        lek = _decode_cursor(cursor)
        if lek:
            query_params["ExclusiveStartKey"] = _float_to_decimal(lek)

        resp = self._table.query(**query_params)
        items = resp.get("Items", [])
        observations: list[Observation] = []
        for item in items:
            data = _decimal_to_float_or_int(item)
            data.pop("PK", None)
            data.pop("SK", None)
            data.pop("entity_type", None)
            obs = Observation.model_validate(data)
            if source_id and obs.source_id != source_id:
                continue
            if review_status and obs.review_status != review_status:
                continue
            if event_type and obs.event_type != event_type:
                continue
            observations.append(obs)

        next_cursor = _encode_cursor(resp.get("LastEvaluatedKey"))
        return observations, next_cursor

    def patch_observation_review(
        self,
        case_id: str,
        observation_id: str,
        expected_version: int,
        field_reviews: list[FieldReview],
        reviewed_by: str = "reviewer",
    ) -> Observation:
        """
        Applies reviewer edits according to DATA_CONTRACTS.md:
        - FieldAction translates to FieldState
        - Candidate value is immutable; reviewed_value and review_note are recorded
        - Aggregate ReviewStatus is computed
        - Optimistic version check enforces expected_version
        """
        existing = self.get_observation(case_id, observation_id)
        if not existing:
            raise EntityNotFoundError(f"Observation {observation_id} not found.")

        if existing.version != expected_version:
            raise VersionConflictError(
                f"Version mismatch: current {existing.version}, expected {expected_version}"
            )

        now = datetime.now(UTC)

        # Apply field reviews
        fields = dict(existing.fields)
        for review in field_reviews:
            if review.field in fields:
                fc = fields[review.field].model_copy()
                fc.state = FIELD_ACTION_TO_STATE[review.action]
                if review.reviewed_value is not None:
                    fc.reviewed_value = review.reviewed_value
                fc.review_note = review.note
                fc.reviewed_by = reviewed_by
                fc.reviewed_at = now
                fields[review.field] = fc

        # Calculate new ReviewStatus
        all_reviewed = True
        any_reviewed = False
        for f in fields.values():
            if f.state in (FIELD_ACTION_TO_STATE.values()) or f.reviewed_at is not None:
                any_reviewed = True
            else:
                all_reviewed = False

        new_status = ReviewStatus.unreviewed
        if all_reviewed and len(fields) > 0:
            new_status = ReviewStatus.reviewed
        elif any_reviewed:
            new_status = ReviewStatus.partially_reviewed

        updated_obs = existing.model_copy(
            update={
                "fields": fields,
                "review_status": new_status,
                "reviewed_at": now,
            }
        )
        return self.put_observation(updated_obs, expected_version=expected_version)

    # -------------------------------------------------------------------------
    # FLAG OPERATIONS
    # -------------------------------------------------------------------------

    def put_flag(self, flag: Flag) -> Flag:
        pk = f"CASE#{flag.case_id}"
        sk = f"FLAG#{flag.flag_id}"
        item = _float_to_decimal(flag.model_dump(mode="json"))
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "flag"
        self._table.put_item(Item=item)
        return flag

    def get_flag(self, case_id: str, flag_id: str) -> Flag | None:
        pk = f"CASE#{case_id}"
        sk = f"FLAG#{flag_id}"
        resp = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = resp.get("Item")
        if not item:
            return None
        data = _decimal_to_float_or_int(item)
        data.pop("PK", None)
        data.pop("SK", None)
        data.pop("entity_type", None)
        return Flag.model_validate(data)

    def list_flags(
        self,
        case_id: str,
        category: FlagCategory | None = None,
        state: FlagState | None = None,
    ) -> list[Flag]:
        pk = f"CASE#{case_id}"
        resp = self._table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("FLAG#")
        )
        items = resp.get("Items", [])
        flags: list[Flag] = []
        for item in items:
            data = _decimal_to_float_or_int(item)
            data.pop("PK", None)
            data.pop("SK", None)
            data.pop("entity_type", None)
            flag = Flag.model_validate(data)
            if category and flag.category != category:
                continue
            if state and flag.state != state:
                continue
            flags.append(flag)
        return flags

    def patch_flag(
        self, case_id: str, flag_id: str, state: FlagState, note: str | None = None
    ) -> Flag:
        existing = self.get_flag(case_id, flag_id)
        if not existing:
            raise EntityNotFoundError(f"Flag {flag_id} not found.")

        updated = existing.model_copy(
            update={
                "state": state,
                "updated_at": datetime.now(UTC),
                "version": existing.version + 1,
            }
        )
        return self.put_flag(updated)

    # -------------------------------------------------------------------------
    # LINK OPERATIONS
    # -------------------------------------------------------------------------

    def put_link(self, link: Link) -> Link:
        pk = f"CASE#{link.case_id}"
        sk = f"LINK#{link.link_id}"
        item = _float_to_decimal(link.model_dump(mode="json"))
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "link"
        self._table.put_item(Item=item)
        return link

    def list_links(self, case_id: str) -> list[Link]:
        pk = f"CASE#{case_id}"
        resp = self._table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("LINK#")
        )
        items = resp.get("Items", [])
        links: list[Link] = []
        for item in items:
            data = _decimal_to_float_or_int(item)
            data.pop("PK", None)
            data.pop("SK", None)
            data.pop("entity_type", None)
            links.append(Link.model_validate(data))
        return links

    # -------------------------------------------------------------------------
    # EXPORT OPERATIONS
    # -------------------------------------------------------------------------

    def put_export(self, export: Export) -> Export:
        pk = f"CASE#{export.case_id}"
        sk = f"EXPORT#{export.export_id}"
        item = _float_to_decimal(export.model_dump(mode="json"))
        item["PK"] = pk
        item["SK"] = sk
        item["entity_type"] = "export"
        self._table.put_item(Item=item)
        return export

    def get_export(self, case_id: str, export_id: str) -> Export | None:
        pk = f"CASE#{case_id}"
        sk = f"EXPORT#{export_id}"
        resp = self._table.get_item(Key={"PK": pk, "SK": sk})
        item = resp.get("Item")
        if not item:
            return None
        data = _decimal_to_float_or_int(item)
        data.pop("PK", None)
        data.pop("SK", None)
        data.pop("entity_type", None)
        return Export.model_validate(data)

    # -------------------------------------------------------------------------
    # IDEMPOTENCY
    # -------------------------------------------------------------------------

    def claim_idempotency(self, case_id: str, idempotency_key: str, request_hash: str) -> bool:
        """
        Attempts to write an idempotency record. Returns True if claimed, False if conflict.
        """
        pk = f"CASE#{case_id}"
        sk = f"IDEMP#{idempotency_key}"
        now = datetime.now(UTC).isoformat()
        item = {
            "PK": pk,
            "SK": sk,
            "entity_type": "idempotency",
            "request_hash": request_hash,
            "created_at": now,
            "ttl": int(datetime.now(UTC).timestamp()) + 86400,
        }
        try:
            self._table.put_item(
                Item=item,
                ConditionExpression="attribute_not_exists(PK)",
            )
            return True
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return False
            raise RepositoryError(str(e)) from e
