export var getPrototypeOf = Object.getPrototypeOf;

export function isUndefined(value) {
  return typeof value === 'undefined';
}

export function isDefined(value) {
  return typeof value !== 'undefined';
}

export function isObject(value) {
  return value !== null && typeof value === 'object';
}

export function isString(value) {
  return typeof value === 'string';
}

export function isBoolean(value) {
  return typeof value === 'boolean';
}

export function isNumber(value) {
  return typeof value === 'number';
}

export function isDate(value) {
  return toString.call(value) === '[object Date]';
}

export var isArray = Array.isArray;

export function isFunction(value) {
  return typeof value === 'function';
}

export function isRegExp(value) {
  return toString.call(value) === '[object RegExp]';
}

export function copy(source) {
  if (isArray(source)) {
    return source.map(copy);
  } else if (isDate(source)) {
    return new Date(source.getTime());
  } else if (isRegExp(source)) {
    let dest = new RegExp(source.source, source.toString().match(/[^\/]*$/)[0]);
    dest.lastIndex = source.lastIndex;
    return dest;
  } else if (isNumber(source) || isString(source) || isBoolean(source)) {
    return source;
  } else {
    let dest = {};
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        dest[key] = copy(source[key]);
      }
    }
    return dest;
  }
}

export function defaults(options = {}, defaults_ = {}) {
  Object.keys(defaults_).forEach(key => {
    if (typeof options[key] === 'undefined') {
      options[key] = copy(defaults_[key]);
    }
  });
  return options;
}
