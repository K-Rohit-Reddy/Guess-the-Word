import asyncio
from sqlalchemy import select
from app.core.database import engine, Base, async_session
from app.core.config import get_settings
from app.core.security import hash_password
from app.models.user import User
from app.models.word import Word

settings = get_settings()

INITIAL_WORDS = [
    "APPLE", "BRAVE", "CRANE", "DREAM", "EAGLE", 
    "FLAME", "GRAPE", "HOUSE", "IMAGE", "JOINT", 
    "KNEEL", "LEMON", "MANGO", "NOBLE", "OCEAN", 
    "PIANO", "QUEEN", "ROVER", "STONE", "TIGER"
]


async def seed_db():
    print("Initializing database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    print("Database tables created.")
    
    async with async_session() as session:
        # Seed Admin
        result = await session.execute(select(User).where(User.username == settings.ADMIN_USERNAME))
        admin = result.scalar_one_or_none()
        
        if not admin:
            print(f"Creating admin user '{settings.ADMIN_USERNAME}'...")
            admin = User(
                display_name=settings.ADMIN_DISPLAY_NAME,
                username=settings.ADMIN_USERNAME,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                role="admin"
            )
            session.add(admin)
        else:
            print(f"Admin user '{settings.ADMIN_USERNAME}' already exists.")
            
        # Seed Words
        for w in INITIAL_WORDS:
            result = await session.execute(select(Word).where(Word.word == w))
            if not result.scalar_one_or_none():
                session.add(Word(word=w))
                
        await session.commit()
        print("Database seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed_db())
