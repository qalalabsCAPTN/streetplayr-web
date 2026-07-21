resource "google_compute_network" "vpc" {
  name                    = "streetplayr-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet_public" {
  name          = "subnet-public"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

resource "google_compute_subnetwork" "subnet_private" {
  name          = "subnet-private"
  ip_cidr_range = "10.0.2.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
  private_ip_google_access = true
}

# Cloud Router for NAT
resource "google_compute_router" "router" {
  name    = "streetplayr-router"
  region  = var.region
  network = google_compute_network.vpc.id
}

# Cloud NAT for serverless outbound traffic
resource "google_compute_router_nat" "nat" {
  name                               = "streetplayr-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

# Serverless VPC Access Connector for Cloud Run
resource "google_vpc_access_connector" "connector" {
  name          = "run-vpc-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.vpc.name
}

# Reserved range for private services access (peering Cloud SQL)
resource "google_compute_global_address" "private_ip_alloc" {
  name          = "private-ip-alloc"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

# Private services connection
resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}

# Cloud Armor WAF Security Policy
resource "google_compute_security_policy" "policy" {
  name        = "streetplayr-waf"
  description = "Cloud Armor protection policy for StreetPlayR"

  # Standard rule: Rate limiting (DDoS mitigations)
  throttle_options {
    rate_limit_threshold {
      count        = 100
      interval_sec = 60
    }
    exceed_action = "deny(429)"
    enforce_on_key_configs {
      enforce_on_key_type = "IP"
    }
  }

  # Block known SQL Injection rules (OWASP Core Rule Set)
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
    description = "Deny preconfigured SQL Injection rules"
  }

  # Block Cross-Site Scripting (XSS)
  rule {
    action   = "deny(403)"
    priority = "1001"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    description = "Deny preconfigured XSS rules"
  }

  # Default rule: Allow traffic
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "default rule"
  }
}
