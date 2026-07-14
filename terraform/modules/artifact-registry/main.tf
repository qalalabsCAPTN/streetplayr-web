resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "streetplayr-containers"
  description   = "Docker repositories for StreetPlayR services"
  format        = "DOCKER"
}
