/**
 * Shared icon + color picker constants used by category/new.tsx and category/[id].tsx
 */

export const CATEGORY_ICONS: { name: string; label: string }[] = [
    { name: "Utensils",       label: "Food" },
    { name: "Coffee",         label: "Coffee" },
    { name: "Pizza",          label: "Pizza" },
    { name: "ShoppingBag",    label: "Shopping" },
    { name: "ShoppingCart",   label: "Cart" },
    { name: "Gift",           label: "Gift" },
    { name: "Car",            label: "Car" },
    { name: "Bike",           label: "Bike" },
    { name: "TrendingUp",     label: "Invest" },
    { name: "Banknote",       label: "Cash" },
    { name: "CreditCard",     label: "Card" },
    { name: "Wallet",         label: "Wallet" },
    { name: "Zap",            label: "Utilities" },
    { name: "Wifi",           label: "Internet" },
    { name: "Phone",          label: "Phone" },
    { name: "Tv",             label: "Entertain" },
    { name: "Heart",          label: "Health" },
    { name: "Pill",           label: "Medicine" },
    { name: "Home",           label: "Home" },
    { name: "Briefcase",      label: "Work" },
    { name: "GraduationCap",  label: "Education" },
    { name: "Music",          label: "Music" },
    { name: "Dumbbell",       label: "Fitness" },
    { name: "Ticket",         label: "Events" },
    { name: "Star",           label: "Favourite" },
    { name: "Package",        label: "Package" },
    { name: "BookOpen",       label: "Books" },
    { name: "TreePalm",       label: "Travel" },
    { name: "Percent",        label: "Tax" },
    { name: "Clock",          label: "Subscr." },
];

export const CATEGORY_COLORS: string[] = [
    "#F97316", // orange
    "#F87171", // red-400
    "#EF4444", // red-500
    "#a855f7", // purple
    "#786BEE", // indigo-ish
    "#6366f1", // indigo
    "#3B82F6", // blue
    "#60A5FA", // blue-400
    "#34d399", // emerald
    "#22C55E", // green
    "#EAB308", // yellow
    "#F59E0B", // amber
    "#14b8a6", // teal
    "#ec4899", // pink
    "#8B5CF6", // violet
    "#64748b", // slate
];

export const CATEGORY_TYPES = [
    { value: "expense", label: "Expense" },
    { value: "income",  label: "Income" },
    { value: "transfer",label: "Transfer" },
];
