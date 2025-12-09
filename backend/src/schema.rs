// @generated automatically by Diesel CLI.

diesel::table! {
    model_configs (id) {
        id -> Text,
        name -> Text,
        provider -> Text,
        model -> Text,
        api_key -> Text,
        base_url -> Nullable<Text>,
        enabled -> Integer,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::table! {
    users (id) {
        id -> Text,
        name -> Text,
        email -> Nullable<Text>,
        avatar -> Nullable<Text>,
        role -> Text,
        created_at -> Text,
        updated_at -> Text,
    }
}

diesel::allow_tables_to_appear_in_same_query!(model_configs, users,);
