variable "project_id" {
  type        = string
  description = "The GCP Project ID for production"
  default     = "streetplayr-prod-38910"
}

variable "region" {
  type        = string
  description = "Primary GCP Region"
  default     = "asia-east1"
}
