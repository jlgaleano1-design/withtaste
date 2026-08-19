import { supabase } from "./supabaseClient.js";

// Reemplazo de window.storage (el key-value store nativo de los artifacts de
// Claude.ai) respaldado por la tabla kv_store de Supabase. Misma forma de
// contrato (get/set/list/delete) para no tocar la lógica de ui-critique-repo.jsx.
// El tercer argumento booleano que manda la app (heredado de la firma de
// window.storage) se ignora acá: en Supabase todo el storage ya es
// compartido por definición.
export function installSupabaseStorage() {
  window.storage = {
    async get(key) {
      const { data, error } = await supabase
        .from("kv_store")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (error) {
        console.error("storage.get failed", key, error);
        return null;
      }
      return data ? { value: data.value } : null;
    },

    async set(key, value) {
      const { error } = await supabase
        .from("kv_store")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) {
        console.error("storage.set failed", key, error);
        return false;
      }
      return true;
    },

    async delete(key) {
      const { error } = await supabase.from("kv_store").delete().eq("key", key);
      if (error) {
        console.error("storage.delete failed", key, error);
        return false;
      }
      return true;
    },

    async list(prefix) {
      const { data, error } = await supabase
        .from("kv_store")
        .select("key")
        .like("key", `${prefix}%`);
      if (error) {
        console.error("storage.list failed", prefix, error);
        return { keys: [] };
      }
      return { keys: (data || []).map((row) => row.key) };
    },
  };
}
