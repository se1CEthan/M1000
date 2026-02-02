export type Json =
| string
| number
| boolean
| null
| { [key: string]: Json | undefined }
| Json[]

export type Database = {
// Allows to automatically instantiate createClient with right options
// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
__InternalSupabase: {
PostgrestVersion: "14.1"
}
public: {
Tables: {
disputes: {
Row: {
admin_notes: string | null
created_at: string
description: string
id: string
initiated_by: string
order_id: string
reason: string
resolution: string | null
resolved_at: string | null
resolved_by: string | null
status: Database["public"]["Enums"]["dispute_status"]
}
Insert: {
admin_notes?: string | null
created_at?: string
description: string
id?: string
initiated_by: string
order_id: string
reason: string
resolution?: string | null
resolved_at?: string | null
resolved_by?: string | null
status?: Database["public"]["Enums"]["dispute_status"]
}
Update: {
admin_notes?: string | null
created_at?: string
description?: string
id?: string
initiated_by?: string
order_id?: string
reason?: string
resolution?: string | null
resolved_at?: string | null
resolved_by?: string | null
status?: Database["public"]["Enums"]["dispute_status"]
}
Relationships: [
{
foreignKeyName: "disputes_initiated_by_fkey"
columns: ["initiated_by"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
{
foreignKeyName: "disputes_order_id_fkey"
columns: ["order_id"]
isOneToOne: false
referencedRelation: "orders"
referencedColumns: ["id"]
},
{
foreignKeyName: "disputes_resolved_by_fkey"
columns: ["resolved_by"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
]
}
orders: {
Row: {
buyer_id: string
completed_at: string | null
created_at: string
crypto_amount: number | null
crypto_currency: string | null
currency: string | null
download_expires_at: string | null
download_url: string | null
id: string
license_key: string | null
order_number: string
payment_id: string | null
payment_method: string | null
platform_fee: number
price: number
product_id: string
seller_earnings: number
seller_id: string
status: Database["public"]["Enums"]["order_status"]
}
Insert: {
buyer_id: string
completed_at?: string | null
created_at?: string
crypto_amount?: number | null
crypto_currency?: string | null
currency?: string | null
download_expires_at?: string | null
download_url?: string | null
id?: string
license_key?: string | null
order_number: string
payment_id?: string | null
payment_method?: string | null
platform_fee: number
price: number
product_id: string
seller_earnings: number
seller_id: string
status?: Database["public"]["Enums"]["order_status"]
}
Update: {
buyer_id?: string
completed_at?: string | null
created_at?: string
crypto_amount?: number | null
crypto_currency?: string | null
currency?: string | null
download_expires_at?: string | null
download_url?: string | null
id?: string
license_key?: string | null
order_number?: string
payment_id?: string | null
payment_method?: string | null
platform_fee?: number
price?: number
product_id?: string
seller_earnings?: number
seller_id?: string
status?: Database["public"]["Enums"]["order_status"]
}
Relationships: [
{
foreignKeyName: "orders_buyer_id_fkey"
columns: ["buyer_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
{
foreignKeyName: "orders_product_id_fkey"
columns: ["product_id"]
isOneToOne: false
referencedRelation: "products"
referencedColumns: ["id"]
},
{
foreignKeyName: "orders_seller_id_fkey"
columns: ["seller_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
]
}
payouts: {
Row: {
amount: number
created_at: string
id: string
processed_at: string | null
seller_id: string
status: string | null
transaction_hash: string | null
wallet_address: string
}
Insert: {
amount: number
created_at?: string
id?: string
processed_at?: string | null
seller_id: string
status?: string | null
transaction_hash?: string | null
wallet_address: string
}
Update: {
amount?: number
created_at?: string
id?: string
processed_at?: string | null
seller_id?: string
status?: string | null
transaction_hash?: string | null
wallet_address?: string
}
Relationships: [
{
foreignKeyName: "payouts_seller_id_fkey"
columns: ["seller_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
]
}
platform_settings: {
Row: {
created_at: string
id: string
key: string
updated_at: string
value: Json
}
Insert: {
created_at?: string
id?: string
key: string
updated_at?: string
value: Json
}
Update: {
created_at?: string
id?: string
key?: string
updated_at?: string
value?: Json
}
Relationships: []
}
products: {
Row: {
average_rating: number | null
category: Database["public"]["Enums"]["product_category"]
changelog: string | null
created_at: string
description: string
documentation_url: string | null
download_count: number | null
file_size: number | null
file_url: string | null
id: string
is_featured: boolean | null
preview_images: string[] | null
price: number
pricing_type: Database["public"]["Enums"]["pricing_type"]
review_count: number | null
seller_id: string
short_description: string | null
slug: string
status: Database["public"]["Enums"]["product_status"]
subscription_price_monthly: number | null
subscription_price_yearly: number | null
tags: string[] | null
thumbnail_url: string | null
title: string
updated_at: string
version: string | null
video_url: string | null
view_count: number | null
}
Insert: {
average_rating?: number | null
category: Database["public"]["Enums"]["product_category"]
changelog?: string | null
created_at?: string
description: string
documentation_url?: string | null
download_count?: number | null
file_size?: number | null
file_url?: string | null
id?: string
is_featured?: boolean | null
preview_images?: string[] | null
price: number
pricing_type?: Database["public"]["Enums"]["pricing_type"]
review_count?: number | null
seller_id: string
short_description?: string | null
slug: string
status?: Database["public"]["Enums"]["product_status"]
subscription_price_monthly?: number | null
subscription_price_yearly?: number | null
tags?: string[] | null
thumbnail_url?: string | null
title: string
updated_at?: string
version?: string | null
video_url?: string | null
view_count?: number | null
}
Update: {
average_rating?: number | null
category?: Database["public"]["Enums"]["product_category"]
changelog?: string | null
created_at?: string
description?: string
documentation_url?: string | null
download_count?: number | null
file_size?: number | null
file_url?: string | null
id?: string
is_featured?: boolean | null
preview_images?: string[] | null
price?: number
pricing_type?: Database["public"]["Enums"]["pricing_type"]
review_count?: number | null
seller_id?: string
short_description?: string | null
slug?: string
status?: Database["public"]["Enums"]["product_status"]
subscription_price_monthly?: number | null
subscription_price_yearly?: number | null
tags?: string[] | null
thumbnail_url?: string | null
title?: string
updated_at?: string
version?: string | null
video_url?: string | null
view_count?: number | null
}
Relationships: [
{
foreignKeyName: "products_seller_id_fkey"
columns: ["seller_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
]
}
profiles: {
Row: {
avatar_url: string | null
bio: string | null
created_at: string
email: string
full_name: string | null
github_url: string | null
id: string
is_verified_seller: boolean | null
role: Database["public"]["Enums"]["user_role"]
total_earnings: number | null
total_sales: number | null
twitter_url: string | null
updated_at: string
user_id: string
wallet_address: string | null
website_url: string | null
verification_status: string | null
verification_submitted_at: string | null
verification_reviewed_at: string | null
verification_reviewed_by: string | null
verification_notes: string | null
}
Insert: {
avatar_url?: string | null
bio?: string | null
created_at?: string
email: string
full_name?: string | null
github_url?: string | null
id?: string
is_verified_seller?: boolean | null
role?: Database["public"]["Enums"]["user_role"]
total_earnings?: number | null
total_sales?: number | null
twitter_url?: string | null
updated_at?: string
user_id: string
wallet_address?: string | null
website_url?: string | null
verification_status?: string | null
verification_submitted_at?: string | null
verification_reviewed_at?: string | null
verification_reviewed_by?: string | null
verification_notes?: string | null
}
Update: {
avatar_url?: string | null
bio?: string | null
created_at?: string
email?: string
full_name?: string | null
github_url?: string | null
id?: string
is_verified_seller?: boolean | null
role?: Database["public"]["Enums"]["user_role"]
total_earnings?: number | null
total_sales?: number | null
twitter_url?: string | null
updated_at?: string
user_id?: string
wallet_address?: string | null
website_url?: string | null
}
Relationships: []
}
reviews: {
Row: {
buyer_id: string
content: string | null
created_at: string
id: string
is_hidden: boolean | null
is_verified_purchase: boolean | null
order_id: string
product_id: string
rating: number
seller_response: string | null
title: string | null
updated_at: string
}
Insert: {
buyer_id: string
content?: string | null
created_at?: string
id?: string
is_hidden?: boolean | null
is_verified_purchase?: boolean | null
order_id: string
product_id: string
rating: number
seller_response?: string | null
title?: string | null
updated_at?: string
}
Update: {
buyer_id?: string
content?: string | null
created_at?: string
id?: string
is_hidden?: boolean | null
is_verified_purchase?: boolean | null
order_id?: string
product_id?: string
rating?: number
seller_response?: string | null
title?: string | null
updated_at?: string
}
Relationships: [
{
foreignKeyName: "reviews_buyer_id_fkey"
columns: ["buyer_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
{
foreignKeyName: "reviews_order_id_fkey"
columns: ["order_id"]
isOneToOne: false
referencedRelation: "orders"
referencedColumns: ["id"]
},
{
foreignKeyName: "reviews_product_id_fkey"
columns: ["product_id"]
isOneToOne: false
referencedRelation: "products"
referencedColumns: ["id"]
},
]
}
wishlists: {
Row: {
created_at: string
id: string
product_id: string
user_id: string
}
Insert: {
created_at?: string
id?: string
product_id: string
user_id: string
}
Update: {
created_at?: string
id?: string
product_id?: string
user_id?: string
}
Relationships: [
{
foreignKeyName: "wishlists_product_id_fkey"
columns: ["product_id"]
isOneToOne: false
referencedRelation: "products"
referencedColumns: ["id"]
},
{
foreignKeyName: "wishlists_user_id_fkey"
columns: ["user_id"]
isOneToOne: false
referencedRelation: "profiles"
referencedColumns: ["id"]
},
]
}
}
Views: {
[_ in never]: never
}
Functions: {
[_ in never]: never
}
Enums: {
dispute_status: "open" | "under_review" | "resolved" | "closed"
order_status: "pending" | "paid" | "completed" | "refunded" | "disputed"
pricing_type:
| "one_time"
| "subscription_monthly"
| "subscription_yearly"
| "custom"
product_category:
| "bots"
| "software"
| "templates"
| "assets"
| "apis"
| "plugins"
product_status:
| "draft"
| "pending"
| "approved"
| "rejected"
| "suspended"
user_role: "buyer" | "seller" | "admin"
}
CompositeTypes: {
[_ in never]: never
}
}
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
DefaultSchemaTableNameOrOptions extends
| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
| { schema: keyof DatabaseWithoutInternals },
TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
Row: infer R
}
? R
: never
: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
DefaultSchema["Views"])
? (DefaultSchema["Tables"] &
DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
Row: infer R
}
? R
: never
: never

export type TablesInsert<
DefaultSchemaTableNameOrOptions extends
| keyof DefaultSchema["Tables"]
| { schema: keyof DatabaseWithoutInternals },
TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
Insert: infer I
}
? I
: never
: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
Insert: infer I
}
? I
: never
: never

export type TablesUpdate<
DefaultSchemaTableNameOrOptions extends
| keyof DefaultSchema["Tables"]
| { schema: keyof DatabaseWithoutInternals },
TableName extends DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
: never = never,
> = DefaultSchemaTableNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
Update: infer U
}
? U
: never
: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
Update: infer U
}
? U
: never
: never

export type Enums<
DefaultSchemaEnumNameOrOptions extends
| keyof DefaultSchema["Enums"]
| { schema: keyof DatabaseWithoutInternals },
EnumName extends DefaultSchemaEnumNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
: never

export type CompositeTypes<
PublicCompositeTypeNameOrOptions extends
| keyof DefaultSchema["CompositeTypes"]
| { schema: keyof DatabaseWithoutInternals },
CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
: never = never,
> = PublicCompositeTypeNameOrOptions extends {
schema: keyof DatabaseWithoutInternals
}
? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
: never

export const Constants = {
public: {
Enums: {
dispute_status: ["open", "under_review", "resolved", "closed"],
order_status: ["pending", "paid", "completed", "refunded", "disputed"],
pricing_type: [
"one_time",
"subscription_monthly",
"subscription_yearly",
"custom",
],
product_category: [
"bots",
"software",
"templates",
"assets",
"apis",
"plugins",
],
product_status: ["draft", "pending", "approved", "rejected", "suspended"],
user_role: ["buyer", "seller", "admin"],
},
},
} as const
