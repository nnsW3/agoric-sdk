// @ts-check
// Lifted mostly from `@agoric/eventual-send/src/E.js`.

import './types';

/**
 * Default implementation of Trap for near objects.
 *
 * @type {TrapImpl}
 */
export const nearTrapImpl = harden({
  applyFunction(target, args) {
    return target(...args);
  },
  applyMethod(target, prop, args) {
    return target[prop](...args);
  },
  get(target, prop) {
    return target[prop];
  },
});

const readOnlyProxyHandler = {
  set(_target, _prop, _value) {
    return false;
  },
  isExtensible(_target) {
    return false;
  },
  setPrototypeOf(_target, _value) {
    return false;
  },
  deleteProperty(_target, _prop) {
    return false;
  },
};

/**
 * A Proxy handler for Trap(x)
 *
 * @param {*} x Any value passed to Trap(x)
 * @param {TrapImpl} syncImpl
 * @returns {ProxyHandler}
 */
const TrapProxyHandler = (x, syncImpl) => {
  return harden({
    ...readOnlyProxyHandler,
    get(_target, p, _receiver) {
      return (...args) => syncImpl.applyMethod(x, p, args);
    },
    apply(_target, _thisArg, argArray = []) {
      return syncImpl.applyFunction(x, argArray);
    },
    has(_target, _p) {
      // TODO: has property is not yet transferrable over captp.
      return true;
    },
  });
};

/**
 * @param {TrapImpl} syncImpl
 * @returns {Trap}
 */
export const makeTrap = syncImpl => {
  const Trap = x => {
    const handler = TrapProxyHandler(x, syncImpl);
    return harden(new Proxy(() => {}, handler));
  };

  const makeTrapGetterProxy = x => {
    const handler = harden({
      ...readOnlyProxyHandler,
      has(_target, _prop) {
        // TODO: has property is not yet transferrable over captp.
        return true;
      },
      get(_target, prop) {
        return syncImpl.get(x, prop);
      },
    });
    return new Proxy(Object.create(null), handler);
  };
  Trap.get = makeTrapGetterProxy;

  return harden(Trap);
};
