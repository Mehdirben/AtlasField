"""Initial schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-01-29

Creates the initial database schema with all tables and enums.
Handles existing databases by checking if tables/enums already exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str) -> bool:
    """Check if a table exists in the database"""
    bind = op.get_bind()
    inspector = inspect(bind)
    return table_name in inspector.get_table_names()


def enum_exists(enum_name: str) -> bool:
    """Check if an enum type exists in PostgreSQL"""
    bind = op.get_bind()
    result = bind.execute(sa.text(
        "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = :name)"
    ), {"name": enum_name})
    return result.scalar()


def upgrade() -> None:
    # Create enums (only if they don't exist)
    if not enum_exists('subscriptiontier'):
        subscription_tier = postgresql.ENUM('free', 'pro', 'enterprise', name='subscriptiontier', create_type=True)
        subscription_tier.create(op.get_bind())
    
    if not enum_exists('analysistype'):
        # Include 'COMPLETE' from the start for fresh installs
        # Note: Use UPPERCASE to match existing enum values in production
        analysis_type = postgresql.ENUM('NDVI', 'RVI', 'MOISTURE', 'FUSION', 'YIELD', 'BIOMASS', 'COMPLETE', name='analysistype', create_type=True)
        analysis_type.create(op.get_bind())
    
    if not enum_exists('alertseverity'):
        alert_severity = postgresql.ENUM('low', 'medium', 'high', 'critical', name='alertseverity', create_type=True)
        alert_severity.create(op.get_bind())

    # Create users table
    if not table_exists('users'):
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('email', sa.String(255), nullable=False),
            sa.Column('hashed_password', sa.String(255), nullable=False),
            sa.Column('full_name', sa.String(255), nullable=True),
            sa.Column('is_active', sa.Boolean(), default=True, nullable=True),
            sa.Column('is_verified', sa.Boolean(), default=False, nullable=True),
            sa.Column('subscription_tier', postgresql.ENUM('free', 'pro', 'enterprise', name='subscriptiontier', create_type=False), default='free', nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create fields table
    if not table_exists('fields'):
        op.create_table(
            'fields',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('name', sa.String(255), nullable=False),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('geometry', postgresql.JSONB(), nullable=False),
            sa.Column('area_hectares', sa.Float(), nullable=True),
            sa.Column('crop_type', sa.String(100), nullable=True),
            sa.Column('planting_date', sa.DateTime(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.PrimaryKeyConstraint('id')
        )

    # Create analyses table
    if not table_exists('analyses'):
        op.create_table(
            'analyses',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('field_id', sa.Integer(), nullable=False),
            sa.Column('analysis_type', postgresql.ENUM('NDVI', 'RVI', 'MOISTURE', 'FUSION', 'YIELD', 'BIOMASS', 'COMPLETE', name='analysistype', create_type=False), nullable=False),
            sa.Column('satellite_date', sa.DateTime(), nullable=True),
            sa.Column('data', postgresql.JSONB(), nullable=False),
            sa.Column('mean_value', sa.Float(), nullable=True),
            sa.Column('min_value', sa.Float(), nullable=True),
            sa.Column('max_value', sa.Float(), nullable=True),
            sa.Column('cloud_coverage', sa.Float(), nullable=True),
            sa.Column('interpretation', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['field_id'], ['fields.id']),
            sa.PrimaryKeyConstraint('id')
        )

    # Create alerts table
    if not table_exists('alerts'):
        op.create_table(
            'alerts',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('field_id', sa.Integer(), nullable=False),
            sa.Column('severity', postgresql.ENUM('low', 'medium', 'high', 'critical', name='alertseverity', create_type=False), nullable=False),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('message', sa.Text(), nullable=False),
            sa.Column('is_read', sa.Boolean(), default=False, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['field_id'], ['fields.id']),
            sa.PrimaryKeyConstraint('id')
        )

    # Create chat_histories table
    if not table_exists('chat_histories'):
        op.create_table(
            'chat_histories',
            sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=False),
            sa.Column('field_id', sa.Integer(), nullable=True),
            sa.Column('messages', postgresql.JSONB(), default=list, nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id']),
            sa.ForeignKeyConstraint(['field_id'], ['fields.id']),
            sa.PrimaryKeyConstraint('id')
        )


def downgrade() -> None:
    op.drop_table('chat_histories')
    op.drop_table('alerts')
    op.drop_table('analyses')
    op.drop_table('fields')
    op.drop_table('users')
    
    # Drop enums
    op.execute('DROP TYPE IF EXISTS subscriptiontier')
    op.execute('DROP TYPE IF EXISTS analysistype')
    op.execute('DROP TYPE IF EXISTS alertseverity')
