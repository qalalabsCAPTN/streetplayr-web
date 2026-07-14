output "static_bucket_name" {
  value = google_storage_bucket.static_assets.name
}

output "temp_bucket_name" {
  value = google_storage_bucket.tryon_temp.name
}

output "results_bucket_name" {
  value = google_storage_bucket.tryon_results.name
}
