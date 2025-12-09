#[macro_use]
extern crate diesel;

use actix_cors::Cors;
use actix_web::{App, HttpResponse, HttpServer, Responder, web};

mod auth;

async fn health_check() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok"
    }))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().ok();
    env_logger::init();

    log::info!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header();

        App::new()
            .wrap(cors)
            .configure(aut::config)
            .route("/api/v1/health", web::get().to(health_check))
    })
    .bind(("0.0.0.0", 8080))?
    .run()
    .await
}
