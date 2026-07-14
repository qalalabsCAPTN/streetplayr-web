# 1. Service Account for Next.js Web Frontend
resource "google_service_account" "sa_web" {
  account_id   = "sa-web-app"
  display_name = "StreetPlayR Web Application Service Account"
}

# 2. Service Account for AI Tryon Worker
resource "google_service_account" "sa_tryon" {
  account_id   = "sa-ai-tryon"
  display_name = "StreetPlayR AI Tryon Service Account"
}

# 3. Service Account for Async Event Worker
resource "google_service_account" "sa_worker" {
  account_id   = "sa-bg-worker"
  display_name = "StreetPlayR Background Event Worker Service Account"
}

# 4. Service Account for Scheduler
resource "google_service_account" "sa_scheduler" {
  account_id   = "sa-cron-scheduler"
  display_name = "StreetPlayR Cron Scheduler Service Account"
}

# Project IAM Bindings (Secret manager access, database connections)
resource "google_project_iam_member" "web_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.sa_web.email}"
}

resource "google_project_iam_member" "worker_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.sa_worker.email}"
}

resource "google_project_iam_member" "web_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.sa_web.email}"
}
