from sqlalchemy import create_engine
engine = create_engine("sqlite:///tngeps.db", echo=True, convert_unicode=True)

from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

from sqlalchemy.orm import sessionmaker
DBSession = sessionmaker(bind=engine)

# Column types.
from sqlalchemy import Column
from sqlalchemy import Date
from sqlalchemy import Integer
from sqlalchemy import String

# Other database necessities.
from sqlalchemy import Table
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

episode_teleplays = Table("episode_teleplays", Base.metadata,
                          Column("episode_id", Integer, ForeignKey("episodes.id")),
                          Column("teleplay_id", Integer, ForeignKey("people.id")))

episode_stories = Table("episode_stories", Base.metadata,
                        Column("episode_id", Integer, ForeignKey("episodes.id")),
                        Column("story_id", Integer, ForeignKey("people.id")))

episode_directors = Table("episode_directors", Base.metadata,
                          Column("episode_id", Integer, ForeignKey("episodes.id")),
                          Column("director_id", Integer, ForeignKey("people.id")))


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True)
    season = Column(Integer)
    episode = Column(Integer)
    title = Column(String)
    airdate = Column(Date)
    teleplay = relationship("Person", secondary=episode_teleplays, backref="teleplays")
    story = relationship("Person", secondary=episode_stories, backref="stories")
    director = relationship("Person", secondary=episode_directors, backref="directors")
    stardate = Column(String)
    url = Column(String)

    def __repr__(self):
        return (u"Episode('%s')" % (self.title)).encode("utf-8")


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True)
    name = Column(String)

    def __repr__(self):
        return (u"Person('%s')" % (self.name)).encode("utf-8")
