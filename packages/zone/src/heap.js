// @ts-check
// @jessie-check

import { Far } from '@endo/far';
import { makeExo, defineExoClass, defineExoClassKit } from '@endo/exo';
import {
  makeScalarMapStore,
  makeScalarSetStore,
  makeScalarWeakMapStore,
  makeScalarWeakSetStore,
} from '@agoric/store';

import { makeOnceKit } from './make-once.js';
import { agoricVatDataKeys as keys } from './keys.js';
import { isPassable } from './is-passable.js';

/**
 * @type {import('.').Stores}
 */
const detachedHeapStores = Far('heapStores', {
  detached: () => detachedHeapStores,
  isStorable: isPassable,

  setStore: makeScalarSetStore,
  mapStore: makeScalarMapStore,
  weakMapStore: makeScalarWeakMapStore,
  weakSetStore: makeScalarWeakSetStore,
});

/**
 * Create a heap (in-memory) zone that uses the default exo and store implementations.
 *
 * @param {string} [baseLabel]
 * @returns {import('.').Zone}
 */
export const makeHeapZone = (baseLabel = 'heapZone') => {
  const { makeOnce, wrapProvider } = makeOnceKit(baseLabel, detachedHeapStores);

  const subZoneProvider = (label, _options) =>
    makeHeapZone(`${baseLabel}.${label}`);

  return Far('heapZone', {
    exo: wrapProvider(makeExo, keys.exo),
    exoClass: wrapProvider(defineExoClass, keys.exoClass),
    exoClassKit: wrapProvider(defineExoClassKit, keys.exoClassKit),
    subZone: wrapProvider(subZoneProvider),

    makeOnce,
    detached: detachedHeapStores.detached,
    isStorable: detachedHeapStores.isStorable,

    mapStore: wrapProvider(detachedHeapStores.mapStore),
    setStore: wrapProvider(detachedHeapStores.setStore),
    weakMapStore: wrapProvider(detachedHeapStores.weakMapStore),
    weakSetStore: wrapProvider(detachedHeapStores.weakSetStore),
  });
};
harden(makeHeapZone);
