"""
Migration script to:
1. Create the gift_lists table
2. Add list_id column to ideas table
3. Seed the 3 default lists
4. Backfill list_id on existing ideas based on userId
"""
import asyncio
from sqlalchemy import text
from database import engine

async def migrate():
    async with engine.begin() as conn:
        # 1. Create gift_lists table if not exists
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS gift_lists (
                id SERIAL PRIMARY KEY,
                slug VARCHAR UNIQUE NOT NULL,
                label VARCHAR NOT NULL,
                user_name VARCHAR,
                enabled BOOLEAN DEFAULT TRUE
            )
        """))
        print("✅ Table gift_lists créée (ou existait déjà)")

        # 2. Add list_id column to ideas if not exists
        await conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'ideas' AND column_name = 'list_id'
                ) THEN
                    ALTER TABLE ideas ADD COLUMN list_id INTEGER REFERENCES gift_lists(id);
                END IF;
            END
            $$;
        """))
        print("✅ Colonne list_id ajoutée à ideas (ou existait déjà)")

        # 2b. Rendre userId nullable (pour la liste commune)
        await conn.execute(text("""
            ALTER TABLE ideas ALTER COLUMN "userId" DROP NOT NULL;
        """))
        print("✅ Colonne userId rendue nullable")

        # 3. Seed default lists (upsert)
        await conn.execute(text("""
            INSERT INTO gift_lists (slug, label, user_name, enabled)
            VALUES 
                ('marie-eve', 'Personne', 'Personne', true),
                ('mathieu', 'Mathieu', 'Mathieu', true),
                ('commune', 'Liste commune', NULL, true)
            ON CONFLICT (slug) DO NOTHING
        """))
        print("✅ Listes par défaut insérées")

        # 4. Backfill list_id on existing ideas based on userId
        # Link ideas to their corresponding gift list via user_name
        await conn.execute(text("""
            UPDATE ideas
            SET list_id = gl.id
            FROM gift_lists gl
            JOIN users u ON gl.user_name = u.name
            WHERE ideas."userId" = u.id
              AND ideas.list_id IS NULL
        """))
        print("✅ list_id mis à jour sur les idées existantes")

    print("\n🎉 Migration terminée avec succès !")

if __name__ == "__main__":
    asyncio.run(migrate())
