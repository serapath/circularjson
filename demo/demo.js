const jsonloop = require('..')

const defaultSeperator = '.'
const cJSON = jsonloop(defaultSeperator)

var obj = { foo: { bar: [{ x: 'y'}, { y: 'x' }], xx: { yy: 'zz' } }, a: 'b' }
obj.foo.bar.push(obj.foo.xx)

const json = cJSON.stringify(obj, 0, 2)
console.log(json) /* {
  "foo": {
    "bar": [
      {
        "x": "y"
      },
      {
        "y": "x"
      },
      {
        "yy": "zz"
      }
    ],
    "xx": "#.foo.bar.2"
  },
  "a": "b"
} */
if (typeof window) document.write(`<xmp>${json}</xmp>`)
const obj2 = cJSON.parse(json)
console.log(obj2) /*{
  "foo": {
    "bar": [
      {
        "x": "y"
      },
      {
        "y": "x"
      },
      {
        "yy": "zz"
      }
    ],
    "xx": { yy: "zz" }
  },
  "a": "b"
} */