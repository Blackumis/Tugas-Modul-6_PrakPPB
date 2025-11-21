import { ThresholdsModel } from "../models/thresholdsModel.js";

export const ThresholdsController = {
  async list(req, res) {
    try {
      const data = await ThresholdsModel.list();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async latest(req, res) {
    try {
      const data = await ThresholdsModel.latest();
      if (data === null) {
        // Return empty default thresholds if no settings exist
        return res.json({
          temperature_value: null,
          humidity_value: null,
          created_at: new Date().toISOString()
        });
      }
      res.json(data);
    } catch (error) {
      console.error("Error in latest threshold:", error);
      res.status(500).json({ error: error.message });
    }
  },

  async create(req, res) {
    try {
      const created = await ThresholdsModel.create(req.body);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },
};
