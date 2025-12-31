import type { Collection, Table } from 'dexie';

export type PaginationOptions<T> = {
  offset?: number;
  limit?: number;
  orderBy?: keyof T;
  direction?: 'asc' | 'desc';
};

const isTable = <T, K, TI>(source: Table<T, K, TI> | Collection<T, K, TI>): source is Table<T, K, TI> =>
  'toCollection' in source;

export const applyPagination = <T, K, TI>(
  source: Table<T, K, TI> | Collection<T, K, TI>,
  options?: PaginationOptions<T>
): Collection<T, K, TI> => {
  const offset = options?.offset && options.offset > 0 ? options.offset : 0;
  const limit = options?.limit && options.limit > 0 ? options.limit : undefined;
  const orderBy = options?.orderBy ? String(options.orderBy) : undefined;

  let collection: Collection<T, K, TI>;

  if (isTable(source)) {
    collection = orderBy ? source.orderBy(orderBy) : source.toCollection();
  } else {
    collection = source;
  }

  if (options?.direction === 'desc') {
    collection = collection.reverse();
  }

  if (offset > 0) {
    collection = collection.offset(offset);
  }

  if (limit !== undefined) {
    collection = collection.limit(limit);
  }

  return collection;
};
