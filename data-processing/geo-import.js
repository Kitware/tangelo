db.geonames.find().forEach(function (doc) {
    if (doc.alternate === undefined && typeof doc.alternatenames === "string") {
        doc.alternate = doc.alternatenames.split(",");
        db.geonames.save(doc);
    }
});
db.geonames.ensureIndex({name: 1, country_code: 1, population: -1})
db.geonames.ensureIndex({alternate: 1, country_code: 1, population: -1})
