"""Rename fields to sites and add forest support

Revision ID: 003_rename_fields_to_sites
Revises: 002_add_complete_enum
Create Date: 2026-01-29

Renames 'fields' table to 'sites', adds site_type enum (field/forest),
adds forest-specific columns, and adds alert_type enum for forest alerts.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '003_rename_fields_to_sites'
down_revision: Union[str, None] = '002_add_complete_enum'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def enum_exists(enum_name: str) -> bool:
    """Check if an enum type exists in PostgreSQL"""
    bind = op.get_bind()
    result = bind.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = :name)"
    ), {"name": enum_name})
    return result.scalar()


def column_exists(table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table"""
    bind = op.get_bind()
    result = bind.execute(sa.text("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = :table_name AND column_name = :column_name
        )
    """), {"table_name": table_name, "column_name": column_name})
    return result.scalar()


def table_exists(table_name: str) -> bool:
    """Check if a table exists"""
    bind = op.get_bind()
    from sqlalchemy import inspect
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # 1. Create site_type enum
    if not enum_exists('sitetype'):
        site_type_enum = postgresql.ENUM('field', 'forest', name='sitetype', create_type=True)
        site_type_enum.create(op.get_bind())
    
    # 2. Create alert_type enum for different alert categories
    if not enum_exists('alerttype'):
        alert_type_enum = postgresql.ENUM(
            'vegetation_health', 'moisture', 'fire_risk', 
            'deforestation', 'drought_stress', 'pest_disease',
            name='alerttype', 
            create_type=True
        )
        alert_type_enum.create(op.get_bind())
    
    # 3. Add FOREST to analysistype enum if not exists
    op.execute("ALTER TYPE analysistype ADD VALUE IF NOT EXISTS 'FOREST'")
    
    # 4. Rename fields table to sites
    if table_exists('fields') and not table_exists('sites'):
        op.rename_table('fields', 'sites')
    
    # 5. Add site_type column to sites table
    if not column_exists('sites', 'site_type'):
        op.add_column('sites', sa.Column(
            'site_type', 
            postgresql.ENUM('field', 'forest', name='sitetype', create_type=False),
            nullable=True
        ))
        # Set default value for existing rows
        op.execute("UPDATE sites SET site_type = 'field' WHERE site_type IS NULL")
        # Make it non-nullable
        op.alter_column('sites', 'site_type', nullable=False, server_default='field')
    
    # 6. Add forest-specific columns to sites table
    if not column_exists('sites', 'forest_type'):
        op.add_column('sites', sa.Column('forest_type', sa.String(50), nullable=True))
    
    if not column_exists('sites', 'tree_species'):
        op.add_column('sites', sa.Column('tree_species', sa.String(100), nullable=True))
    
    if not column_exists('sites', 'protected_status'):
        op.add_column('sites', sa.Column('protected_status', sa.String(100), nullable=True))
    
    # 7. Add alert_type column to alerts table
    if not column_exists('alerts', 'alert_type'):
        op.add_column('alerts', sa.Column(
            'alert_type',
            postgresql.ENUM(
                'vegetation_health', 'moisture', 'fire_risk', 
                'deforestation', 'drought_stress', 'pest_disease',
                name='alerttype', 
                create_type=False
            ),
            nullable=True
        ))
        # Set default value for existing alerts
        op.execute("UPDATE alerts SET alert_type = 'vegetation_health' WHERE alert_type IS NULL")
    
    # 8. Rename foreign key column in analyses table
    if column_exists('analyses', 'field_id') and not column_exists('analyses', 'site_id'):
        op.alter_column('analyses', 'field_id', new_column_name='site_id')
    
    # 9. Rename foreign key column in alerts table
    if column_exists('alerts', 'field_id') and not column_exists('alerts', 'site_id'):
        op.alter_column('alerts', 'field_id', new_column_name='site_id')
    
    # 10. Rename foreign key column in chat_histories table
    if column_exists('chat_histories', 'field_id') and not column_exists('chat_histories', 'site_id'):
        op.alter_column('chat_histories', 'field_id', new_column_name='site_id')


def downgrade() -> None:
    # Reverse the changes
    
    # Rename columns back
    if column_exists('chat_histories', 'site_id'):
        op.alter_column('chat_histories', 'site_id', new_column_name='field_id')
    
    if column_exists('alerts', 'site_id'):
        op.alter_column('alerts', 'site_id', new_column_name='field_id')
    
    if column_exists('analyses', 'site_id'):
        op.alter_column('analyses', 'site_id', new_column_name='field_id')
    
    # Drop alert_type column
    if column_exists('alerts', 'alert_type'):
        op.drop_column('alerts', 'alert_type')
    
    # Drop forest columns
    if column_exists('sites', 'protected_status'):
        op.drop_column('sites', 'protected_status')
    if column_exists('sites', 'tree_species'):
        op.drop_column('sites', 'tree_species')
    if column_exists('sites', 'forest_type'):
        op.drop_column('sites', 'forest_type')
    if column_exists('sites', 'site_type'):
        op.drop_column('sites', 'site_type')
    
    # Rename table back
    if table_exists('sites') and not table_exists('fields'):
        op.rename_table('sites', 'fields')
    
    # Drop enums (note: PostgreSQL doesn't support DROP VALUE from enum)
    op.execute('DROP TYPE IF EXISTS alerttype')
    op.execute('DROP TYPE IF EXISTS sitetype')
