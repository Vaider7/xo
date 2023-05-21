use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
#[serde(tag = "action")]
#[serde(rename_all(deserialize = "camelCase"))]
pub enum ClientAction {
    SendToken { token: String, uuid: String },
    SendInvitation { enemy_id: String, uuid: String },
}

#[derive(Serialize)]
#[serde(tag = "action")]
#[serde(rename_all(serialize = "camelCase"))]
pub enum ServerAction {
    SendUuid { uuid: Uuid },
    ConfirmAuth {}
}
