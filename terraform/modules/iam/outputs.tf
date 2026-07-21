output "sa_web_email" {
  value = google_service_account.sa_web.email
}

output "sa_tryon_email" {
  value = google_service_account.sa_tryon.email
}

output "sa_worker_email" {
  value = google_service_account.sa_worker.email
}

output "sa_scheduler_email" {
  value = google_service_account.sa_scheduler.email
}
