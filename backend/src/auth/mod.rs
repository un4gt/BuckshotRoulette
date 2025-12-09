use actix_web::{
    HttpResponse, Responder, get,
    web::{self, ServiceConfig},
};

#[get("/me")]
async fn me() -> impl Responder {
    HttpResponse::Ok().body("me")
}

#[get("logout")]
async fn logout() -> impl Responder {
    HttpResponse::Ok().body("logout")
}

#[get("login")]
async fn login() -> impl Responder {
    HttpResponse::Ok().body("login")
}

pub fn config(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .service(me)
            .service(logout)
            .service(login),
    )
}
