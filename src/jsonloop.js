
module.exports = jsonloop

function jsonloop (specialChar = '.') {
  const safeSpecialChar = '\\x' + ('0' + specialChar.charCodeAt(0).toString(16)).slice(-2)
  const escapedSafeSpecialChar = '\\' + safeSpecialChar
  const specialCharRG = new RegExp(safeSpecialChar, 'g')
  const safeSpecialCharRG = new RegExp(escapedSafeSpecialChar, 'g')
  const safeStartWithSpecialCharRG = new RegExp('(?:^|([^\\\\]))' + escapedSafeSpecialChar)
  const indexOf = [].indexOf || function (v) {
      for(var i=this.length;i--&&this[i]!==v;);
      return i
    }

  return { stringify, parse }
  function parse (text, reviver) {
    return JSON.parse(text, generateReviver(reviver))
  }
  function stringify (value, replacer, space) {
    const replace = generateReplacer(value, replacer)
    return JSON.stringify(value, replace, space)
  }
  function generateReplacer (value, replacer, resolve) {
    replacer = typeof replacer === 'object' ? (key, value) => key !== '' && indexOf.call(replacer, key) < 0 ? void 0 : value : replacer
    const path = []
    const all  = [value]
    const seen = [value]
    const mapp = [specialChar]
    var doNotIgnore = false
    var last = value
    var lvl  = 1
    var i
    return function (key, value) {
      try {
        // the replacer has rights to decide
        // if a new object should be returned
        // or if there's some key to drop
        // let's call it here rather than "too late"
        if (replacer) value = replacer.call(this, key, value)
        if (doNotIgnore) { // first pass should be ignored, since it's just the initial object
          if (last !== this) {
            i = lvl - indexOf.call(all, this) - 1
            lvl -= i
            all.splice(lvl, all.length)
            path.splice(lvl - 1, path.length)
            last = this
          }
          if (typeof value === 'object' && value) {
            // if object isn't referring to parent object, add to the
            // object path stack. Otherwise it is already there.
            if (indexOf.call(all, value) < 0) all.push(last = value)
            lvl = all.length
            i = indexOf.call(seen, value)
            if (i < 0) {
              i = seen.push(value) - 1
              // key cannot contain specialChar but could be not a string
              path.push(('' + key).replace(specialCharRG, safeSpecialChar))
              mapp[i] = specialChar + path.join(specialChar)
            } else {
              value = `#${mapp[i]}` // https://tools.ietf.org/html/rfc6901
            }
          } else {
            if (typeof value === 'string' && resolve) {
              // ensure no special char involved on deserialization
              // in this case only first char is important
              // no need to replace all value (better performance)
              value = value.replace(safeSpecialChar, escapedSafeSpecialChar).replace(specialChar, safeSpecialChar)
            }
          }
        } else {
          doNotIgnore = true
        }
        return value
      } catch (e) {
        console.log('ERROR', e)
        return value
      }
    }
  }
  function retrieveFromPath (current, keys) {
    for (var i = 0, length = keys.length; i < length; i++) {
      // keys should be normalized back here
      current = current[keys[i].replace(safeSpecialCharRG, specialChar)]
    }
    return current
  }
  function generateReviver (reviver) {
    return function (key, value) {
      var isString = typeof value === 'string'
      if (isString && value.charAt(0) === '#' && value.charAt(1) === specialChar) return new String(value.slice(2))
      if (key === '') value = regenerate(value, value, {})
      // again, only one needed, do not use the RegExp for this replacement
      // only keys need the RegExp
      if (isString) value = value.replace(safeStartWithSpecialCharRG, '$1' + specialChar).replace(escapedSafeSpecialChar, safeSpecialChar)
      return reviver ? reviver.call(this, key, value) : value
    }
  }
  function regenerateArray(root, current, retrieve) {
    for (var i = 0, length = current.length; i < length; i++) current[i] = regenerate(root, current[i], retrieve)
    return current
  }
  function regenerateObject(root, current, retrieve) {
    for (var key in current) if (current.hasOwnProperty(key)) current[key] = regenerate(root, current[key], retrieve)
    return current
  }
  function regenerate(root, current, retrieve) {
    return current instanceof Array
      ? regenerateArray(root, current, retrieve) // fast Array reconstruction
      : current instanceof String
        ? current.length  // root is an empty string
          ? retrieve.hasOwnProperty(current)
            ? retrieve[current]
            : retrieve[current] = retrieveFromPath(root, current.split(specialChar))
          : root
        : current instanceof Object // dedicated Object parser
          ? regenerateObject(root, current, retrieve)
          : current // value as it is
  }
}