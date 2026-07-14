resource "google_database_instance" "postgres" {
  name             = "streetplayr-db-instance"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-custom-2-7680" # 2 vCPU, 7.5 GB RAM (Production scale)
    availability_type = "REGIONAL"         # High availability failover
    disk_size         = 100
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.vpc_id
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
    }

    # Enable optimal performance flags
    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }
}

resource "google_database" "db" {
  name     = "streetplayr_prod"
  instance = google_database_instance.postgres.name
}

resource "google_database_user" "admin_user" {
  name     = "streetplayr_admin"
  instance = google_database_instance.postgres.name
  password = "SuperSecretSecurePasswordChangeMeInProd" # Managed by Secret Manager in deployment
}
