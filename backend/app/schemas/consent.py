from typing import Optional

from pydantic import BaseModel


class ConsentRequest(BaseModel):
    policyVersion: str


class ConsentStatusOut(BaseModel):
    granted: bool
    policyVersion: Optional[str] = None
    grantedAt: Optional[str] = None
