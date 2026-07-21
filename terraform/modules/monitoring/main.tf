# Notification Channels (Targeting operator emails)
resource "google_monitoring_notification_channel" "email" {
  display_name = "Operations Team Email Channel"
  type         = "email"
  labels = {
    email_address = "operations@streetplayr.com"
  }
}

# Billing Budget Alerts
resource "google_billing_budget" "budget" {
  billing_account = "012345-6789AB-CDEF01" # Placeholders updated during rollout
  display_name    = "streetplayr-monthly-budget"

  budget_filter {
    projects = ["projects/${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "USD"
      units         = "500" # Budget threshold set at $500 monthly
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }
}

# Alert Policy 1: HTTP 5xx Error rates
resource "google_monitoring_alert_policy" "http_errors" {
  display_name = "Cloud Run 5xx Error Alerts"
  combiner     = "OR"
  conditions {
    display_name = "Cloud Run HTTP 5xx rate > 1%"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.name]
}
