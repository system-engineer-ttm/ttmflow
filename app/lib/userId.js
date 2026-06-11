/* Next USRxxx id from the max existing suffix — count-based ids collide after deletes */
export async function nextUserId(db) {
  const { data } = await db.from("users").select("id").like("id", "USR%");
  const max = (data ?? []).reduce((m, r) => {
    const n = parseInt(r.id.slice(3), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `USR${String(max + 1).padStart(3, "0")}`;
}
