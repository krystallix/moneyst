import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "../supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: "moneyst", path: "auth/callback" })


function parseSupabaseRedirect(url: string): Record<string, string> {
    const fragment = url.includes("#") ? url.split("#")[1] : url.split("?")[1] ?? "";
    return Object.fromEntries(new URLSearchParams(fragment));
}

async function createSessionFromUrl(url: string) {
    const params = parseSupabaseRedirect(url);

    if (params.error) throw new Error(params.error_description ?? params.error);

    const { access_token, refresh_token } = params;

    if (!access_token) return;

    const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token: refresh_token ?? "",
    });

    if (error) throw error;

    return data.session;
}

export async function googleSignIn() {
    console.log("[Google] start");

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
            skipBrowserRedirect: true,
        },
    });

    if (error) throw error;

    const res = await WebBrowser.openAuthSessionAsync(data?.url ?? "", redirectTo);

    if (res.type === "success" && res.url) {
        const session = await createSessionFromUrl(res.url);
        return session;
    }

    return null;
}