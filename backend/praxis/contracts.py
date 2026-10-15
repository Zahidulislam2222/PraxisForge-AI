from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Login(Contract):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class WorkspaceInput(Contract):
    name: str = Field(min_length=2, max_length=80)


class DocumentInput(Contract):
    title: str = Field(min_length=1, max_length=160)
    content: str = Field(min_length=20, max_length=100000)
    source: str = Field(min_length=1, max_length=500)


class TaskInput(Contract):
    request: str = Field(min_length=10, max_length=10000)
    client: str = Field(min_length=1, max_length=120)
    recipient: str = Field(min_length=3, max_length=254)
    account: Literal["internal-drafts"]
    document_ids: list[UUID] = Field(min_length=1, max_length=10)


class Decision(Contract):
    decision: Literal["approve", "reject"]
    payload_hash: str = Field(pattern=r"^[a-f0-9]{64}$")


class BrainBlocked(Contract):
    status: Literal["blocked"]
    reason: str = Field(min_length=10, max_length=1000)


class BrainOutput(Contract):
    status: Literal["ready"]
    summary: str = Field(min_length=10, max_length=3000)
    subject: str = Field(min_length=3, max_length=200)
    body: str = Field(min_length=20, max_length=6000)
    commitments: list[str] = Field(max_length=20)
    source_ids: list[UUID] = Field(min_length=1, max_length=10)
