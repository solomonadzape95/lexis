import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/agent/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    // Construct absolute redirect URL
    const redirectUrl = new URL(next, requestUrl.origin);

    // Create a response object that can set cookies
    const response = NextResponse.redirect(redirectUrl);

    // Create Supabase client with request/response cookies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options ?? {});
          });
        },
      },
    });

    // Exchange the code for a session (this will set cookies via setAll above)
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(new URL("/?error=auth", requestUrl.origin));
    }

    // Fetch GitHub user data and store avatar URL
    if (data.session?.provider_token && data.user) {
      try {
        const githubRes = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${data.session.provider_token}` },
        });
        
        if (githubRes.ok) {
          const githubUser = (await githubRes.json()) as {
            login?: string;
            avatar_url?: string;
          };
          
          // Update user metadata with GitHub info
          await supabase.auth.updateUser({
            data: {
              user_name: githubUser.login,
              login: githubUser.login,
              avatar_url: githubUser.avatar_url,
              picture: githubUser.avatar_url,
            },
          });

          // Create or update user profile using admin client
          if (supabaseAdmin) {
            const { error: profileError } = await supabaseAdmin
              .from("user_profiles")
              .upsert(
                {
                  id: data.user.id,
                  github_avatar_url: githubUser.avatar_url,
                  display_name: githubUser.login,
                },
                { onConflict: "id" },
              );

            if (profileError) {
              console.error("Failed to create/update user profile:", profileError);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch GitHub user data:", err);
        // Don't fail auth if GitHub API call fails
      }
    }

    // Log cookies being set (for debugging)
    const cookies = response.cookies.getAll();
    console.log(
      "Setting cookies:",
      cookies.map((c) => c.name),
    );

    return response;
  }

  return NextResponse.redirect(new URL("/?error=no_code", requestUrl.origin));
}
