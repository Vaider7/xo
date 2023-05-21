use axum::extract::State;
use sea_orm::{prelude::*, DatabaseConnection, EntityTrait, StatementBuilder};
use serde::Serialize;

use crate::{
    entities::{prelude::*, user},
    error::AppError,
    SocketConnectionType,
};

#[derive(Serialize)]
#[serde(rename_all(serialize = "camelCase"))]
pub struct ActivePlayer {
    firstname: String,
    lastname: String,
    patronymic: String,
    id: i32,
    is_playing: bool,
}

impl From<user::Model> for ActivePlayer {
    fn from(value: user::Model) -> Self {
        Self {
            firstname: value.firstname,
            lastname: value.lastname,
            patronymic: value.patronymic,
            id: value.id,
            is_playing: value.is_playing,
        }
    }
}

pub async fn get_active_players(
    State(db): State<DatabaseConnection>,
    State(connections): State<SocketConnectionType>,
) -> Result<Vec<ActivePlayer>, AppError> {
    let mut connected_players = vec![];

    for conn in &mut connections.lock().await.iter() {
        if let Some(user_id) = conn.user_id {
            connected_players.push(user_id)
        }
    }

    let users = User::find()
        .filter(user::Column::Id.is_in(connected_players))
        .all(&db)
        .await?;

    let mut active_players = vec![];
    for user in users {
        active_players.push(ActivePlayer { ..user.into() })
    }

    Ok(active_players)
}
