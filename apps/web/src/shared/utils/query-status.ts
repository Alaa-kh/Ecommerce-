/** True while waiting for first data or a new query key (keeps previous via placeholderData). */
export function isQueryAwaitingData(query: {
  isLoading: boolean;
  isFetching: boolean;
  isPlaceholderData: boolean;
}): boolean {
  return query.isLoading || (query.isFetching && query.isPlaceholderData);
}
