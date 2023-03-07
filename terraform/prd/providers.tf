provider "aws" {
  region  = "eu-west-1"
  profile = var.profile
  default_tags {
    tags = var.tags
  }
}
