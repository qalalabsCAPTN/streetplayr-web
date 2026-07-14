# 1. Cloud Run Service: streetplayr-web (Next.js Application)
resource "google_cloud_run_v2_service" "web_app" {
  name     = "streetplayr-web"
  location = var.region

  template {
    service_account = var.sa_web_email

    scaling {
      min_instance_count = 1
      max_instance_count = 30
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/streetplayr-containers/web-app:latest"

      resources {
        limits = {
          cpu    = "2"
          memory = "1024Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXT_PUBLIC_SITE_URL"
        value = "https://streetplayr.com"
      }

      # Secrets loaded from Secret Manager directly
      env {
        name = "STRIPE_SECRET_KEY"
        value_source {
          secret_key_ref {
            secret = "STRIPE_SECRET_KEY"
            version = "latest"
          }
        }
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret = "DATABASE_CONNECTION_URL"
            version = "latest"
          }
        }
      }
    }

    vpc_access {
      connector = var.vpc_connector_id
      egress    = "ALL_TRAFFIC"
    }
  }
}

# Public access to streetplayr-web (gated by Load Balancer in production)
resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  name   = google_cloud_run_v2_service.web_app.name
  location = var.region
  role   = "roles/run.invoker"
  member = "allUsers"
}

# 2. Cloud Run Service: ai-tryon-service
resource "google_cloud_run_v2_service" "tryon_service" {
  name     = "ai-tryon-service"
  location = var.region

  template {
    service_account = var.sa_tryon_email
    timeout         = "120s" # Higher timeout limits for image logic

    scaling {
      min_instance_count = 0 # Scale to 0 to optimize cost
      max_instance_count = 5
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/streetplayr-containers/tryon-service:latest"

      resources {
        limits = {
          cpu    = "4"
          memory = "4096Mi" # Extra RAM allocation
        }
      }

      env {
        name = "GOOGLE_AI_API_KEY"
        value_source {
          secret_key_ref {
            secret = "GOOGLE_AI_API_KEY"
            version = "latest"
          }
        }
      }
    }
  }
}

# 3. Cloud Run Service: background-worker
resource "google_cloud_run_v2_service" "bg_worker" {
  name     = "background-worker"
  location = var.region

  template {
    service_account = var.sa_worker_email

    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/streetplayr-containers/bg-worker:latest"

      resources {
        limits {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret = "DATABASE_CONNECTION_URL"
            version = "latest"
          }
        }
      }
    }
  }
}
