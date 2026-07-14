# 1. Bucket: static-assets (Public Read, CDN enabled)
resource "google_storage_bucket" "static_assets" {
  name                        = "${var.project_id}-static-assets"
  location                    = var.region
  uniform_bucket_level_access = true
}

# Make objects public read
resource "google_storage_bucket_iam_member" "static_public_rule" {
  bucket = google_storage_bucket.static_assets.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# 2. Bucket: tryon-temp (Private, Lifecycle deletions)
resource "google_storage_bucket" "tryon_temp" {
  name                        = "${var.project_id}-tryon-temp"
  location                    = var.region
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 1 # Delete user uploads after 1 day (cost + privacy protection)
    }
    action {
      type = "Delete"
    }
  }
}

# IAM permissions to write to tryon-temp
resource "google_storage_bucket_iam_member" "web_write_temp" {
  bucket = google_storage_bucket.tryon_temp.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${var.sa_web_email}"
}

resource "google_storage_bucket_iam_member" "tryon_read_temp" {
  bucket = google_storage_bucket.tryon_temp.name
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${var.sa_tryon_email}"
}

# 3. Bucket: tryon-results (Public Read, 7-day lifespans)
resource "google_storage_bucket" "tryon_results" {
  name                        = "${var.project_id}-tryon-results"
  location                    = var.region
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 7 # Automatically clear output logs after 7 days
    }
    action {
      type = "Delete"
    }
  }
}

# IAM rules tryon service account needs to write to tryon-results
resource "google_storage_bucket_iam_member" "tryon_write_results" {
  bucket = google_storage_bucket.tryon_results.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${var.sa_tryon_email}"
}

# Make tryon-results readable by all users
resource "google_storage_bucket_iam_member" "results_public_read" {
  bucket = google_storage_bucket.tryon_results.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}
