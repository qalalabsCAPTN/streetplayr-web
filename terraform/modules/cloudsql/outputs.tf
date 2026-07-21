output "db_connection_name" {
  value = google_database_instance.postgres.connection_name
}

output "db_private_ip" {
  value = google_database_instance.postgres.private_ip_address
}
