import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/agent/logger";

export type UserProfile = {
  id: string;
  display_name: string | null;
  github_avatar_url: string | null;
  theme: "light" | "dark" | "system";
  accent_color: string;
  default_language: string;
  preferred_languages: string[];
  created_at: string;
  updated_at: string;
};

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" - we'll create a default profile
    return NextResponse.json(
      { error: "Failed to fetch profile.", details: error.message },
      { status: 500 },
    );
  }

  // If no profile exists, return default values
  if (!data) {
    return NextResponse.json({
      id: session.user.id,
      display_name: session.githubUsername,
      github_avatar_url: session.githubAvatarUrl,
      theme: "system",
      accent_color: "#3c3cf6",
      default_language: "en",
      preferred_languages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as UserProfile);
  }

  return NextResponse.json(data as UserProfile);
}

export async function PUT(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server." },
      { status: 500 },
    );
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const updates: Partial<UserProfile> = {};

  if (body.display_name !== undefined) updates.display_name = body.display_name;
  if (body.theme !== undefined) {
    if (["light", "dark", "system"].includes(body.theme)) {
      updates.theme = body.theme;
    }
  }
  if (body.accent_color !== undefined) updates.accent_color = body.accent_color;
  if (body.default_language !== undefined)
    updates.default_language = body.default_language;
  if (body.preferred_languages !== undefined) {
    updates.preferred_languages = Array.isArray(body.preferred_languages)
      ? body.preferred_languages
      : [];
  }

  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .upsert(
      {
        id: session.user.id,
        ...updates,
      },
      { onConflict: "id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update profile.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data as UserProfile);
}
