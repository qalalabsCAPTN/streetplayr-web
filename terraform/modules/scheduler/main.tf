# Job 1: Release expired locks (runs every 5 mins)
resource "google_cloud_scheduler_job" "release_reservations" {
  name        = "cron-release-reservations"
  description = "Trigger stock reservation expiry validations"
  schedule    = "*/5 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/release-expired-reservations"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}

# Job 2: Audit reconciliation (runs every 15 mins)
resource "google_cloud_scheduler_job" "reconciliation" {
  name        = "cron-reconciliation"
  description = "Runs payment transaction audit cycles"
  schedule    = "*/15 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/reconciliation"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}
