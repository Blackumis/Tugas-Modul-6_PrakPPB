import supabase from "../config/supabaseClient.js";

const TABLE = "threshold_settings";

function normalize(row) {
  if (!row) return row;
  return {
    ...row,
    temperature_value: row.temperature_value === null ? null : Number(row.temperature_value),
    humidity_value: row.humidity_value === null ? null : Number(row.humidity_value),
  };
}

export const ThresholdsModel = {
  async list() {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, temperature_value, humidity_value, note, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    return data.map(normalize);
  },

  async latest() {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("id, temperature_value, humidity_value, note, created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Supabase error in latest():", error);
        throw error;
      }

      console.log("Latest threshold data:", data);
      return normalize(data);
    } catch (error) {
      console.error("Error in latest():", error);
      throw error;
    }
  },

  async create(payload) {
    const { temperature_value, humidity_value, note } = payload;

    if (temperature_value !== undefined && typeof temperature_value !== "number") {
      throw new Error("temperature_value must be a number");
    }

    if (humidity_value !== undefined && typeof humidity_value !== "number") {
      throw new Error("humidity_value must be a number");
    }

    if (temperature_value === undefined && humidity_value === undefined) {
      throw new Error("Either temperature_value or humidity_value must be provided");
    }

    const row = {
      temperature_value: temperature_value ?? null,
      humidity_value: humidity_value ?? null,
      note: note?.slice(0, 180) ?? null,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select("id, temperature_value, humidity_value, note, created_at")
      .single();

    if (error) throw error;
    return normalize(data);
  },
};
