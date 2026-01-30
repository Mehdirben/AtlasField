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
    
    # Helper to check if a label exists
    def has_label(type_name, label):
        res = bind.execute(sa.text(
            "SELECT 1 FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid "
            "WHERE typname = :type AND enumlabel = :label"
        ), {"type": type_name, "label": label})
        return res.scalar() is not None

    # 1. Standardize subscriptiontier
    if has_label('subscriptiontier', 'free'):
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'free' TO 'FREE'"))
    if has_label('subscriptiontier', 'pro'):
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'pro' TO 'PRO'"))
    if has_label('subscriptiontier', 'enterprise'):
        bind.execute(sa.text("ALTER TYPE subscriptiontier RENAME VALUE 'enterprise' TO 'ENTERPRISE'"))
        
    # 2. Standardize sitetype
    if has_label('sitetype', 'field'):
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'field' TO 'FIELD'"))
    if has_label('sitetype', 'forest'):
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'forest' TO 'FOREST'"))
        
    # 3. Standardize alertseverity
    if has_label('alertseverity', 'low'):
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'low' TO 'LOW'"))
    if has_label('alertseverity', 'medium'):
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'medium' TO 'MEDIUM'"))
    if has_label('alertseverity', 'high'):
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'high' TO 'HIGH'"))
    if has_label('alertseverity', 'critical'):
        bind.execute(sa.text("ALTER TYPE alertseverity RENAME VALUE 'critical' TO 'CRITICAL'"))

    # 4. Update existing data (always safe to run)
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
