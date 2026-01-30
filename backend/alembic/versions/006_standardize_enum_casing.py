"""Standardize enum casing to UPPERCASE

Revision ID: 006_standardize_enum_casing
Revises: 005_add_forest_baseline
Create Date: 2026-01-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006_standardize_enum_casing'
down_revision: Union[str, None] = '005_add_forest_baseline'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    
    # 1. Standardize subscriptiontier
    try:
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'free' TO 'FREE'"))
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'pro' TO 'PRO'"))
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'enterprise' TO 'ENTERPRISE'"))
    except Exception:
        pass
        
    # 2. Standardize sitetype (if not already done)
    try:
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'field' TO 'FIELD'"))
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'forest' TO 'FOREST'"))
    except Exception:
        pass
        
    # 3. Standardize alertseverity
    try:
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'low' TO 'LOW'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'medium' TO 'MEDIUM'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'high' TO 'HIGH'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'critical' TO 'CRITICAL'"))
    except Exception:
        pass

    # 4. Update existing data to ensure consistency
    bind.execute(sa.text("UPDATE users SET subscription_tier = 'FREE' WHERE subscription_tier::text = 'free'"))
    bind.execute(sa.text("UPDATE users SET subscription_tier = 'PRO' WHERE subscription_tier::text = 'pro'"))
    bind.execute(sa.text("UPDATE users SET subscription_tier = 'ENTERPRISE' WHERE subscription_tier::text = 'enterprise'"))
    
    bind.execute(sa.text("UPDATE sites SET site_type = 'FIELD' WHERE site_type::text = 'field'"))
    bind.execute(sa.text("UPDATE sites SET site_type = 'FOREST' WHERE site_type::text = 'forest'"))
    
    bind.execute(sa.text("UPDATE alerts SET severity = 'LOW' WHERE severity::text = 'low'"))
    bind.execute(sa.text("UPDATE alerts SET severity = 'MEDIUM' WHERE severity::text = 'medium'"))
    bind.execute(sa.text("UPDATE alerts SET severity = 'HIGH' WHERE severity::text = 'high'"))
    bind.execute(sa.text("UPDATE alerts SET severity = 'CRITICAL' WHERE severity::text = 'critical'"))


def downgrade() -> None:
    bind = op.get_bind()
    
    try:
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'FREE' TO 'free'"))
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'PRO' TO 'pro'"))
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'ENTERPRISE' TO 'enterprise'"))
    except Exception:
        pass
        
    try:
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'FIELD' TO 'field'"))
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'FOREST' TO 'forest'"))
    except Exception:
        pass
        
    try:
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'LOW' TO 'low'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'MEDIUM' TO 'medium'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'HIGH' TO 'high'"))
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'CRITICAL' TO 'critical'"))
    except Exception:
        pass
