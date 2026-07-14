output "web_app_url" {
  value = google_cloud_run_v2_service.web_app.uri
}

output "tryon_service_url" {
  value = google_cloud_run_v2_service.tryon_service.uri
}

output "bg_worker_url" {
  value = google_cloud_run_v2_service.bg_worker.uri
}
