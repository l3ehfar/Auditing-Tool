import { dataset, type Instance } from '@marcellejs/core';
import { store } from './store';

type EventType =
  | 'select-image'
  | 'create-audit-card'
  | 'remove-audit-card'
  | 'add-example'
  | 'remove-example'
  | 'edit-description'
  | 'mask-image'
  | 'filter-dataset'
  | 'add-evidence';

const log = dataset<Instance>('log', store);

export function logEvent(type: EventType, data: unknown = undefined) {
  log.ready.then(() => {
    log.create({
      type,
      data,
    });
  });
}
