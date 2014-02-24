import bson.json_util
import json
import unittest

import tangelo


class Tester(unittest.TestCase):
    def test_tangelo_types_numeric(self):
        """
        Demonstrate the correct usage of @tangelo.types.
        """

        def op(a, b, c=None, d=None):
            return a + b + c + d

        @tangelo.types(int, float, c=int, d=float)
        def op_typed(a, b, c=None, d=None):
            return op(a, b, c, d)

        self.assertEqual(op("1", "2", c="3", d="4"), "1234")
        self.assertEqual(op_typed("1", "2", c="3", d="4"), 10.0)

    def test_tangelo_types_json(self):
        """
        Demonstrate that @tangelo.types works with any non-base-type conversion functions.
        """

        @tangelo.types(json.loads)
        def extract_foo(data):
            return data["foo"]

        json_text = json.dumps({"foo": "bar",
                                "baz": "quux"})

        self.assertEqual(extract_foo(json_text), "bar")

    def test_tangelo_types_bson(self):
        """
        Demonstrate that @tangelo.types works with functions in modules not
        imported by Tangelo itself.
        """

        @tangelo.types(bson.json_util.loads)
        def extract_foo(data):
            return data["foo"]

        json_text = json.dumps({"foo": "bar",
                                "baz": "quux"})

        self.assertEqual(extract_foo(json_text), "bar")

    def test_tangelo_types_bad_conversion(self):
        """
        Demonstrate the failure mode when a value cannot be converted.
        """

        @tangelo.types(int)
        def identity(x):
            return x

        result = identity("3.2")

        self.assertTrue(isinstance(result, tangelo.HTTPStatusCode))
        self.assertEqual(result.code, "400 Input Value Conversion Failed")
        self.assertEqual(result.msg, "invalid literal for int() with base 10: '3.2'")

    def test_return_type(self):
        """
        Demonstrate the use of the tangelo.return_type() decorator.
        """

        def excite(data):
            return json.dumps(data) + "!!!"

        @tangelo.return_type(excite)
        def dump(data):
            data["foo"] = "bar"
            return data

        test_data = {"bar": "baz"}
        result = dump(test_data)

        self.assertEqual(result, json.dumps(test_data) + "!!!")

    def test_return_type_bad_conversion(self):
        msg = "this is a bad converter function"
        def bad_converter(x):
            raise ValueError(msg)

        @tangelo.return_type(bad_converter)
        def dump(data):
            return data

        result = dump({})

        self.assertTrue(isinstance(result, tangelo.HTTPStatusCode))
        self.assertEqual(result.code, "500 Return Value Conversion Failed")
        self.assertEqual(result.msg, msg)


if __name__ == "__main__":
    unittest.main()
