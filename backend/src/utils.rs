use axum::{http::StatusCode, Json};

use crate::error::AppError;

pub fn make_app_error(reason: i32) -> AppError {
    AppError::CustomError(StatusCode::from_u16(666).unwrap(), Json(serde_json::to_value(reason).unwrap()))
}