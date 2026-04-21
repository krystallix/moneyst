import type { User } from "@supabase/supabase-js";
import { supabase } from "../supabase";

export type UserProfile = {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    preferred_currency: string | null;
    timezone: string | null;
    locale: string | null;
};

export async function getProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    const { data, error } = await supabase
        .schema("moneyst")
        .from("users")
        .select("id, email, full_name, avatar_url, preferred_currency, timezone, locale")
        .eq("id", userId)
        .maybeSingle();

    if (error) console.log("getProfile error:", error);

    return { data: data as UserProfile | null, error };
}

export async function checkProfile(user: User) {
    return getProfile(user.id);
}

export async function updateProfile(
    user: any,
    fullName: string,
    avatar: string | null,
    preferredCurrency: string,
    timezone: string,
    locale: string
) {
    const { error } = await supabase.schema("moneyst").from("users").upsert({
        id: user.id,
        email: user.email,
        full_name: fullName || null,
        avatar_url: avatar,
        preferred_currency: preferredCurrency,
        timezone,
        locale,
    });

    return { error };
}