#![feature(string_remove_matches)]
mod api;
mod entities;
pub mod error;
pub mod utils;
use std::time::Duration;
use std::{net::SocketAddr, sync::Arc};

use api::handlers::get_active_players;
use api::users::login;
use api::ws::{check_alive_sockets, handle_socket};
use api::{users::create_user, ws::handler};
use axum::{
    extract::ws::{Message, WebSocket},
    routing::{get, post},
    Router,
};
use futures::stream::SplitSink;
use sea_orm::{Database, DatabaseConnection};
use tokio::sync::Mutex;
use tower_http::{
    cors::{Any, CorsLayer},
    services::{ServeDir, ServeFile},
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    db: DatabaseConnection,
    sockets: Arc<Mutex<Vec<SocketConnection>>>,
}

#[derive(Debug)]
pub struct SocketConnection {
    uuid: Uuid,
    socket: SplitSink<WebSocket, Message>,
    user_id: Option<i32>,
}

type SocketConnectionType = Arc<Mutex<Vec<SocketConnection>>>;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::registry() .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "debug,hyper=info".into()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let db = Database::connect("sqlite://xo.db").await?;

    let connections: SocketConnectionType = Arc::new(Mutex::new(vec![]));

    let app_state = AppState {
        db,
        sockets: connections.clone(),
    };

    let users_router = Router::new()
        .route("/login", post(login))
        .route("/create", post(create_user))
        .route("/active", get(get_active_players));

    let app = Router::new()
        .fallback_service(
            ServeDir::new("../frontend/dist")
                .not_found_service(ServeFile::new("../frontend/dist/index.html")),
        )
        .nest("/users", users_router)
        .route("/ws", get(handler))
        .with_state(app_state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let mut check_interval = tokio::time::interval(Duration::from_secs(10));

    tokio::spawn(async move {
        loop {
            let cloned_connections = Arc::clone(&connections);
            check_interval.tick().await;
            check_alive_sockets(cloned_connections).await;
        }
    });

    axum::Server::bind(&"127.0.0.1:3000".parse().unwrap())
        .serve(app.into_make_service_with_connect_info::<SocketAddr>())
        .await?;
    Ok(())
}
