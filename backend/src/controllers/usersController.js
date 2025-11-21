import supabase from "../config/supabaseClient.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    const { username, password, profile_picture } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          password: hashedPassword,
          profile_picture: profile_picture || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      id: data.id,
      username: data.username,
      profile_picture: data.profile_picture,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    // Find user
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Update last login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", user.id);

    res.json({
      id: user.id,
      username: user.username,
      profile_picture: user.profile_picture,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("users")
      .select("id, username, profile_picture, created_at, last_login")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, profile_picture } = req.body;

    const updateData = {};

    if (username) updateData.username = username;
    if (profile_picture) updateData.profile_picture = profile_picture;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      id: data.id,
      username: data.username,
      profile_picture: data.profile_picture,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
