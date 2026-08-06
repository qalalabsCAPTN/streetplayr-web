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

# Job 3: Unicommerce Product Catalog Sync (runs every 5 mins)
resource "google_cloud_scheduler_job" "sync_products" {
  name        = "cron-sync-products"
  description = "Sync product catalog from Unicommerce to Supabase"
  schedule    = "*/5 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/sync-products"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}

# Job 4: Unicommerce Inventory Sync (runs every 3 mins)
resource "google_cloud_scheduler_job" "sync_inventory" {
  name        = "cron-sync-inventory"
  description = "Sync inventory levels from Unicommerce to Supabase"
  schedule    = "*/3 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/sync-inventory"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}

# Job 5: Unicommerce Order Status Sync (runs every 5 mins)
resource "google_cloud_scheduler_job" "sync_order_status" {
  name        = "cron-sync-order-status"
  description = "Poll Unicommerce for order status and shipment tracking updates"
  schedule    = "*/5 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/sync-order-status"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}

# Job 6: Unicommerce Returns Sync (runs every 10 mins)
resource "google_cloud_scheduler_job" "sync_returns" {
  name        = "cron-sync-returns"
  description = "Sync return/reverse-pickup status from Unicommerce"
  schedule    = "*/10 * * * *"
  time_zone   = "UTC"
  region      = var.region

  http_target {
    http_method = "GET"
    uri         = "${var.web_app_url}/api/cron/sync-returns"

    oidc_token {
      service_account_email = var.sa_scheduler_email
    }
  }
}

