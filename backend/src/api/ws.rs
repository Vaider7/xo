use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    headers::{self, authorization::Bearer},
    response::Response, TypedHeader,
};

use tokio::sync::Mutex;


use std::net::SocketAddr;
use std::sync::Arc;


use futures::{sink::SinkExt, stream::StreamExt};


//allows to extract the IP of connecting user
use axum::extract::connect_info::ConnectInfo;

use uuid::Uuid;

use crate::{SocketConnection, SocketConnectionType, AppState};

use super::{
    actions::{ClientAction, ServerAction},
    users::send_uuid,
};

pub async fn handler(
    ws: WebSocketUpgrade,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    token: Option<TypedHeader<headers::Authorization<Bearer>>>,
    State(app_state): State<AppState>,
) -> Response {
    tracing::debug!("New connection with addr: {:?}", addr);
    if let Some(TypedHeader(token)) = token {
        token.token();
    }
    ws.on_upgrade(move |socket| handle_socket(socket, addr, app_state.sockets))
}
pub async fn handle_socket(
    socket: WebSocket,
    addr: SocketAddr,
    connections: Arc<Mutex<Vec<SocketConnection>>>,
) {
    let mut txs = connections.lock().await;
    let (mut tx, mut rx) = socket.split();

    let uuid = Uuid::new_v4();
    let res = tx
        .send(Message::Text(
            serde_json::to_string(&ServerAction::SendUuid { uuid }).unwrap(),
        ))
        .await;

    if let Err(err) = res {
        tracing::warn!("Some shit happend: {}", err);
        return;
    } else {
        txs.push(SocketConnection {
            uuid,
            socket: tx,
            user_id: None,
        });
        drop(txs);
    }

    while let Some(Ok(msg)) = rx.next().await {
        if let Message::Text(text) = msg {
            tracing::debug!("the message: {}", text);
            if let Ok(action) = serde_json::from_str::<ClientAction>(&text) {
                match action {
                    ClientAction::SendInvitation { enemy_id, uuid } => unreachable!(),
                    ClientAction::SendToken { token, uuid } => {
                        send_uuid(token, uuid, connections.clone()).await
                    }
                }
            } else {
                tracing::warn!("Unknown action received:{}", text);
            }
        }
    }
}

pub async fn check_alive_sockets(connections: SocketConnectionType) {
    let mut connections = connections.lock().await;
    for mut conn in std::mem::take(&mut *connections) {
        if conn
            .socket
            .send(Message::Text("Alive?".to_string()))
            .await
            .is_ok()
        {
            connections.push(conn);
        }
    }

    tracing::debug!("{:?}", connections);
}
