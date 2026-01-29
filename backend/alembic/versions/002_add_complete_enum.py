"""Add complete to analysistype enum

Revision ID: 002_add_complete_enum
Revises: 001_initial
Create Date: 2026-01-29

Adds 'complete' value to the analysistype enum for comprehensive field analysis.
This migration handles both fresh installs (where enum already has 'complete')
and existing databases that need the value added.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '002_add_complete_enum'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add 'COMPLETE' to analysistype enum if it doesn't exist
    # Note: Use UPPERCASE to match existing enum values (NDVI, RVI, etc.)
    # IF NOT EXISTS prevents errors on fresh installs where 001 already includes it
    op.execute("ALTER TYPE analysistype ADD VALUE IF NOT EXISTS 'COMPLETE'")


def downgrade() -> None:
    # PostgreSQL doesn't support removing enum values directly
    # To truly downgrade, you'd need to:
    # 1. Create a new enum without 'complete'
    # 2. Migrate all data
    # 3. Drop old enum and rename new one
    # For simplicity, we leave 'complete' in place (it's harmless if unused)
    pass
