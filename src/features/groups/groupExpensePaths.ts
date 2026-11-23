/** URL of a group's detail screen (US4.1). Must match the route in App.tsx. */
export function groupPath(groupId: string): string {
  return `/groups/${groupId}`;
}

/** URL of the form to add an expense to a group (US4.2). Must match the route in App.tsx. */
export function newGroupExpensePath(groupId: string): string {
  return `/groups/${groupId}/expenses/new`;
}
