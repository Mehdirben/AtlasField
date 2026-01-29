"""
Alembic migration script template
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4fd71a3bdbaf'
down_revision: Union[str, None] = '003_rename_fields_to_sites'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # This migration was manually supplemented by direct SQL commands
    # because PostgreSQL doesn't support RENAME VALUE inside transactions.
    # The following commands ensure the database state matches the SQLAlchemy models.
    bind = op.get_bind()
    
    # These might fail if already renamed, so we wrap them in TRY/EXCEPT or just ignore if they exist
    # For a clean migration, we just ensure the data is correct.
    try:
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'field' TO 'FIELD'"))
    except Exception:
        pass
    try:
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'forest' TO 'FOREST'"))
    except Exception:
        pass
        
    try:
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'vegetation_health' TO 'VEGETATION_HEALTH'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'moisture' TO 'MOISTURE'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'fire_risk' TO 'FIRE_RISK'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'deforestation' TO 'DEFORESTATION'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'drought_stress' TO 'DROUGHT_STRESS'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'pest_disease' TO 'PEST_DISEASE'"))
    except Exception:
        pass

    # Update existing data
    bind.execute(sa.text("UPDATE sites SET site_type = 'FIELD' WHERE site_type::text = 'field'"))
    bind.execute(sa.text("UPDATE sites SET site_type = 'FOREST' WHERE site_type::text = 'forest'"))
    
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'VEGETATION_HEALTH' WHERE alert_type::text = 'vegetation_health'"))
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'MOISTURE' WHERE alert_type::text = 'moisture'"))
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'FIRE_RISK' WHERE alert_type::text = 'fire_risk'"))
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'DEFORESTATION' WHERE alert_type::text = 'deforestation'"))
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'DROUGHT_STRESS' WHERE alert_type::text = 'drought_stress'"))
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'PEST_DISEASE' WHERE alert_type::text = 'pest_disease'"))

    bind.execute(sa.text("UPDATE analyses SET analysis_type = 'COMPLETE' WHERE analysis_type::text = 'complete'"))


def downgrade() -> None:
    bind = op.get_bind()
    
    try:
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'FIELD' TO 'field'"))
        bind.execute(sa.text("ALTER TYPE sitetype RENAME VALUE 'FOREST' TO 'forest'"))
    except Exception:
        pass
    
    try:
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'VEGETATION_HEALTH' TO 'vegetation_health'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'MOISTURE' TO 'moisture'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'FIRE_RISK' TO 'fire_risk'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'DEFORESTATION' TO 'deforestation'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'DROUGHT_STRESS' TO 'drought_stress'"))
        bind.execute(sa.text("ALTER TYPE alerttype RENAME VALUE 'PEST_DISEASE' TO 'pest_disease'"))
    except Exception:
        pass
    
    bind.execute(sa.text("UPDATE sites SET site_type = 'field' WHERE site_type::text = 'FIELD'"))
    bind.execute(sa.text("UPDATE sites SET site_type = 'forest' WHERE site_type::text = 'FOREST'"))
    
    bind.execute(sa.text("UPDATE alerts SET alert_type = 'vegetation_health' WHERE alert_type::text = 'VEGETATION_HEALTH'"))
    bind.execute(sa.text("UPDATE analyses SET analysis_type = 'complete' WHERE analysis_type::text = 'COMPLETE'"))
