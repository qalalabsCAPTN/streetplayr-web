locals {
  secrets = [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "GOOGLE_AI_API_KEY",
    "DATABASE_CONNECTION_URL",
    "CRON_SECRET"
  ]
}

resource "google_secret_manager_secret" "secret" {
  count     = length(locals.secrets)
  secret_id = locals.secrets[count.index]

  replication {
    auto {}
  }
}

# Access bindings for web app service account
resource "google_secret_manager_secret_iam_member" "web_accessor" {
  count     = length(locals.secrets)
  secret_id = google_secret_manager_secret.secret[count.index].secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.sa_web_email}"
}

# Access bindings for tryon service account
resource "google_secret_manager_secret_iam_member" "tryon_accessor" {
  count     = 1
  secret_id = "GOOGLE_AI_API_KEY"
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.sa_tryon_email}"
  depends_on = [google_secret_manager_secret.secret]
}
