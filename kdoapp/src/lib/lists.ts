/** Liste telle que renvoyée par /api/lists/ et /api/lists/all/ */
export type ApiList = {
  slug: string;
  label: string;
  owner_id?: number | null;
  owner_name: string | null;
  is_common: boolean;
  enabled: boolean;
};

/** Option du champ « Pour » des formulaires d'idée ; `user` = propriétaire (null pour la liste commune). */
export type ListOption = { value: string; label: string; user: string | null };

export function toListOptions(lists: ApiList[]): ListOption[] {
  return lists.map((l) => ({ value: l.slug, label: l.label, user: l.owner_name }));
}
