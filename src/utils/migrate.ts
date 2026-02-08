import type { UtilityCostSet } from '@/types';

/**
 * Migrate a legacy UtilityCostSet that has `garbageCost` into the new
 * `serviceCosts` array format.  Safe to call on already-migrated data.
 *
 * TODO: Remove this migration once all persisted data has been converted.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateUtilityCostSet(data: any): UtilityCostSet {
  if (data.garbageCost !== undefined && !data.serviceCosts) {
    const { garbageCost, ...rest } = data;
    return {
      ...rest,
      serviceCosts: [{ name: 'Rác', fee: garbageCost }],
    };
  }
  return data as UtilityCostSet;
}
