terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "streetplayr-tf-state-prod"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

module "network" {
  source     = "../../modules/network"
  project_id = var.project_id
  region     = var.region
}

module "iam" {
  source     = "../../modules/iam"
  project_id = var.project_id
}

module "artifact_registry" {
  source = "../../modules/artifact-registry"
  region = var.region
}

module "cloudsql" {
  source     = "../../modules/cloudsql"
  project_id = var.project_id
  region     = var.region
  vpc_id     = module.network.vpc_id
}

module "secrets" {
  source         = "../../modules/secret-manager"
  project_id     = var.project_id
  sa_web_email   = module.iam.sa_web_email
  sa_tryon_email = module.iam.sa_tryon_email
}

module "storage" {
  source         = "../../modules/storage"
  project_id     = var.project_id
  region         = var.region
  sa_web_email   = module.iam.sa_web_email
  sa_tryon_email = module.iam.sa_tryon_email
}

module "cloud_run" {
  source             = "../../modules/cloud-run"
  project_id         = var.project_id
  region             = var.region
  vpc_connector_id   = module.network.connector_id
  db_connection_name = module.cloudsql.db_connection_name
  sa_web_email       = module.iam.sa_web_email
  sa_tryon_email     = module.iam.sa_tryon_email
  sa_worker_email    = module.iam.sa_worker_email
  security_policy_id = module.network.security_policy_id
}

module "pubsub" {
  source        = "../../modules/pubsub"
  project_id    = var.project_id
  bg_worker_url = module.cloud_run.bg_worker_url
}

module "scheduler" {
  source             = "../../modules/scheduler"
  project_id         = var.project_id
  region             = var.region
  web_app_url        = module.cloud_run.web_app_url
  sa_scheduler_email = module.iam.sa_scheduler_email
}

module "monitoring" {
  source     = "../../modules/monitoring"
  project_id = var.project_id
}
