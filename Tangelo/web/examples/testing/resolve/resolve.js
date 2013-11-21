/*jslint browser: true, unparam: true */
/*globals d3, $, console */

(function (tangelo) {
    "use strict";

    function resolveMain(specRoot, doneRoot, changed, ids) {
        function resolve(spec, done) {
            var s,
                first,
                prop,
                hasProps = false,
                rest = {},
                deps,
                value,
                i;

            ids = ids || {};

            if (tangelo.isString(spec) || tangelo.isNumber(spec) || tangelo.isBoolean(spec)) {
                done(spec);
            } else if (tangelo.isObject(spec)) {
                // Perform shortcut if there are no dependencies on what changed
                if (changed && spec["@"] && spec["@"].deps && !spec["@"].deps.hasOwnProperty(changed) && spec.id !== changed) {
                    done(spec["@"].current, deps);
                } else if (spec.hasOwnProperty("@extract")) {
                    s = spec["@extract"];
                    resolve(s.from, function (part, deps) {
                        var i, fields = s.field.split(".");
                        for (i = 0; i < fields.length; i += 1) {
                            part = part[fields[i]];
                        }
                        done(part, deps);
                    });
                } else if (spec.hasOwnProperty("@url")) {
                    s = spec["@url"];
                    resolve(s, function (url, deps) {
                        d3.json(url, function (error, part) {
                            done(part, deps);
                        });
                    });
                } else if (spec.hasOwnProperty("@json")) {
                    s = spec["@json"];
                    resolve(s, function (data, deps) {
                        done(JSON.stringify(data), deps);
                    });
                } else if (spec.hasOwnProperty("@join")) {
                    s = spec["@join"];
                    resolve(s, function (arr, deps) {
                        done(arr.join(""), deps);
                    });
                } else if (spec.hasOwnProperty("@concat")) {
                    s = spec["@concat"];
                    resolve(s, function (arr, deps) {
                        done([].concat.apply([], arr), deps);
                    });
                } else if (spec.hasOwnProperty("@view")) {
                    s = spec["@view"];
                    resolve(s.spec, function (attr, deps) {
                        var i, fields = s.constructor.split("."), cons = window;
                        for (i = 0; i < fields.length; i += 1) {
                            cons = cons[fields[i]];
                        }
                        if (changed && spec["@"]) {
                            spec["@"].current.update(attr);
                        } else {
                            spec["@"] = {current: cons(attr)};
                        }
                        done(spec["@"].current, deps);
                    });
                } else if (spec.hasOwnProperty("@ref")) {
                    s = spec["@ref"].split(".");
                    deps = $.extend(true, {}, ids[s[0]]["@"].deps);
                    deps[s[0]] = true;
                    value = ids[s[0]]["@"].current;
                    for (i = 1; i < s.length; i += 1) {
                        value = value[s[i]];
                    }
                    done(value, deps);
                } else if (spec.hasOwnProperty("@update")) {
                    s = spec["@update"];
                    done(function (value) {
                        var d;
                        for (d in value) {
                            if (value.hasOwnProperty(d)) {
                                ids[s][d] = value[d];
                            }
                        }
                        resolveMain(specRoot, undefined, s, ids);
                    }, deps);
                } else {
                    for (prop in spec) {
                        if (spec.hasOwnProperty(prop) && prop !== "@") {
                            if (hasProps === false) {
                                hasProps = true;
                                first = prop;
                            } else {
                                rest[prop] = spec[prop];
                            }
                        }
                    }
                    if (hasProps) {
                        resolve(spec[first], function (firstData, firstDeps) {
                            resolve(rest, function (restData, restDeps) {
                                var deps, d;

                                restData[first] = firstData;
                                if (restData.hasOwnProperty("id")) {
                                    ids[restData.id] = spec;
                                }

                                deps = $.extend(true, {}, firstDeps);
                                for (d in restDeps) {
                                    if (restDeps.hasOwnProperty(d)) {
                                        deps[d] = restDeps[d];
                                    }
                                }

                                spec["@"] = {
                                    current: restData,
                                    deps: deps
                                };
                                done(restData, deps);
                            });
                        });
                    } else {
                        done({}, {});
                    }
                }
            } else if (tangelo.isArray(spec)) {
                if (spec.length === 0) {
                    done([]);
                } else {
                    resolve(spec[0], function (car, carDeps) {
                        resolve(spec.slice(1), function (cdr, cdrDeps) {
                            var deps, d;
                            cdr.unshift(car);
                            deps = $.extend(true, {}, carDeps);
                            for (d in cdrDeps) {
                                if (cdrDeps.hasOwnProperty(d)) {
                                    deps[d] = cdrDeps[d];
                                }
                            }
                            done(cdr, deps);
                        });
                    });
                }
            } else {
                console.log("error: unexpected data");
            }
        }
        resolve(specRoot, doneRoot || function () { return null; });
    }

    tangelo.resolve = resolveMain;
}(window.tangelo));