"""
Add forest baseline columns to sites table for YoY comparison
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_forest_baseline'
down_revision: Union[str, None] = '4fd71a3bdbaf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add baseline columns for forest year-over-year tracking
    op.add_column('sites', sa.Column('baseline_carbon_t_ha', sa.Float(), nullable=True))
    op.add_column('sites', sa.Column('baseline_canopy_cover', sa.Float(), nullable=True))
    op.add_column('sites', sa.Column('baseline_date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    op.drop_column('sites', 'baseline_date')
    op.drop_column('sites', 'baseline_canopy_cover')
    op.drop_column('sites', 'baseline_carbon_t_ha')
