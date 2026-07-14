# 1. Topic: payment-events
resource "google_pubsub_topic" "payment_events" {
  name = "payment-events"
}

# 2. Topic: tryon-logs
resource "google_pubsub_topic" "tryon_logs" {
  name = "tryon-logs"
}

# Push subscription forwarding payments to the background worker service
resource "google_pubsub_subscription" "worker_payment_sub" {
  name  = "worker-payment-subscription"
  topic = google_pubsub_topic.payment_events.name

  push_config {
    push_endpoint = "${var.bg_worker_url}/api/webhooks/pubsub-payment"
  }
}
