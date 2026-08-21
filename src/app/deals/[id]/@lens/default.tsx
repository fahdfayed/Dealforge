// No lens open. Rendered for the @lens slot on a hard load or refresh, where
// Next cannot recover the slot's state; without this the deal pages 404.
export default function NoLens() {
  return null;
}
