import csv
import datetime
import sys

from startrek import Base
from startrek import engine
from startrek import DBSession
from startrek import Episode
from startrek import Person

# Read CSV files into list.
try:
    with open("episodes.csv") as episodes_f:
        with open("people.csv") as people_f:
            episodes = list(csv.reader(episodes_f))
            people = list(csv.reader(people_f))
except IOError as e:
    print >>sys.stderr, "error: %s" % (e)
    sys.exit(1)

# Start ORM classes up, and get a connection to the DB.
Base.metadata.create_all(engine)
session = DBSession()

# Create a table of id-to-Person based on the contents of the people file.
people_rec = {}
for i, name in people[1:]:
    i = int(i)

    p = Person(id=i, name=name.decode("utf-8"))

    people_rec[i] = p
    session.add(p)

# Construct an Episode for each record in the episode file, and add it to the
# databse.
for i, season, ep, title, airdate, teleplay, story, director, stardate, url in episodes[1:]:
    # Extract the fields that exist more or less as is.
    i = int(i)
    season = int(season)
    ep = int(ep)

    # Parse the (American-style) dates from the airdate field, creating a Python
    # datetime object.
    month, day, year = airdate.split("/")
    month = "%02d" % (int(month))
    day = "%02d" % (int(day))
    airdate = datetime.datetime.strptime("%s/%s/%s" % (month, day, year), "%m/%d/%Y")

    # Create lists of writers, story developers, and directors from the
    # comma-separated people ids in these fields.
    teleplay = map(lambda writer: people_rec[int(writer)], teleplay.split(","))
    story = map(lambda writer: people_rec[int(writer)], story.split(","))
    director = map(lambda writer: people_rec[int(writer)], director.split(","))

    # Construct an Episode object, and add it to the live session.
    ep = Episode(id=int(i), season=season, episode=ep, title=title.decode("utf-8"), airdate=airdate, stardate=stardate, teleplay=teleplay, story=story, director=director, url=url)
    session.add(ep)

# Commit the changes to the session.
session.commit()
sys.exit(0)
