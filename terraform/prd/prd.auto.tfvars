env     = "prd"
profile = "737219370090"

tags = {
  terraform    = "true"
  environment  = "prd"
  owner        = "team-infra-sre@ledger.fr"
  project      = "2131"
  organization = "consumer"
  service      = "nft-indexer-evm"
}

documentdb = {
  cluster_size   = 1
  instance_class = "db.r5.xlarge"
  cluster_parameters = [
    {
      apply_method = "pending-reboot"
      name         = "tls"
      value        = "disabled"
    }
  ]
}

rabbitmq = {
  username       = "nft"
  instance_class = "mq.m5.large"
  engine_version = "3.9.16"
}

opensearch = {
  engine_version = "OpenSearch_2.3"
  instance_count = 1
  instance_type  = "m5.large.search"
  volume_size    = 200
}

rds = {
  pg_version                      = "14.5"
  pg_instance_class               = "db.r5.xlarge"
  pg_storage_type                 = "gp3"
  pg_backup                       = true
  pg_min_allocated_storage        = 200
  pg_backup_retention_period      = 7
  pg_performance_insights_enabled = true
  pg_deletion_protection          = true
}

secrets = {
  NODE_PASSWORD            = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QHUVPNxnMBZCtoFerbQ/47WAAAAeTB3BgkqhkiG9w0BBwagajBoAgEAMGMGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM9nkCG8GoQkIDfX0+AgEQgDZ/Ptfy3u3TzGpMAA0vQagfwAngtjwO75WLE5mDORUySaC8dE24bTbfwrTRFEyjJgCOW2JqGMI="
  PROXY_CREDENTIALS        = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QFX7Mx9b1ERxiAD2L40HtcVAAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNAKt1b3JnrNoVg5OQIBEIBwGqcvepGaidG9C22KN9RP82JNETCWh/XerB5eF/XNAK8aiiE/iWQN4bW+cpLKzri2+GFlqw+9aEVS+VYw0NiBxuSY6c1XNgeTrdoX4wQgssL4+d2HI5ecYKUAplM+6OjF2XhqQmxeD9II3e1hbVzoVg=="
  ETH_NODE_USERNAME        = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QFYXtZ+fDuE4rj8cOrME5ylAAAAZDBiBgkqhkiG9w0BBwagVTBTAgEAME4GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM/QObeL/FaQ6U67VIAgEQgCFwGyX1g/xrdxNUbKvJD5ynnFW2meL5flQYggn+YM85cTM="
  ETH_NODE_PASSWORD        = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QHGNvlvOd++v2591ZoW0eeKAAAAfTB7BgkqhkiG9w0BBwagbjBsAgEAMGcGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMQ01XcgcbKYjAqGnVAgEQgDqV3TaeV6WNa7WE/u9ufBjyC21mi9bfiFnikib2Byyw4TA63FRU8gi972fpgBzBRF5+9K+6aljKW+km"
  MATIC_NODE_USERNAME      = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QEWxqWfQWeuQcURBMr76ktpAAAAZTBjBgkqhkiG9w0BBwagVjBUAgEAME8GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMrl/jmLojr+YlBtOJAgEQgCLVpwx76sfT1iG5CVlzlwBNajebrRfQlDh3B3R6aKBneOxW"
  MATIC_NODE_PASSWORD      = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QHimZi6rgan++wjdMRWWoyzAAAAeTB3BgkqhkiG9w0BBwagajBoAgEAMGMGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMPdew3rxpTO07Ah7QAgEQgDYRediee53vIPah1ea/tP+V5PDKCnZqz7tQOKh5m4AvECIUjIaHcWgpJim2eguvu1BrP/qCLO8="
  DATABASE_URL             = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QFaGBYeBP8V0aAKWLlAWDyEAAAA2DCB1QYJKoZIhvcNAQcGoIHHMIHEAgEAMIG+BgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDIeZAWlpH9uhVKd/sgIBEICBkLGvH9Mx3+Yf3ad6r6Xh41xO/MWapk/1k6Me9yyWsX22z+9sKSxFvHuBuiZz+yOfhzvek62rWxYyp7QGu0oIMzrWDZKox2RX5INJSy70KtX26/mOZ87//AcQ2QbZFaepl4ddvQJXOdwfYh0S9RUHtrWxstqGRsepKet61Zx/8cjTzwNwDniQtBJf/nxNSkhTfg=="
  SEARCH_URL               = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QG0HjkREX1J7qGHzhYgdstSAAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDNrHQNqWa/1+WsSqFwIBEIBw8uq4P4f+sJo3tuaA4jJI9rFsBIGTxFJ6B4XK+JGT8GL2JSzbIwQ18kGQVqeh5SMtFwfGtxUdIKgtJbXI5294cAZpWBRINsSlgvrOvP+gUsQUYGGpXMBSifJ5aWYhDbVbbcMDI8FZK0CZATH+ndODsg=="
  ETH_GOERLI_NODE_USERNAME = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QH38yuCkObwmfruzirXh9d3AAAAZzBlBgkqhkiG9w0BBwagWDBWAgEAMFEGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMi/9i7rKm7DUW4r8XAgEQgCTE0U5G4C825bvkrJP1yuLRVqOcOW50UyWBbnx/pnzXVa60NCk="
  ETH_GOERLI_NODE_PASSWORD = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQHM3hHrp3ro3STshYpiPSZcAAAAbjBsBgkqhkiG9w0BBwagXzBdAgEAMFgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMGCkpbACHuKW9e/rEAgEQgCuCQjDMlVI3qJN5+SYw/FNZUrD/T/ESJ5ZQrLZieVEzqtzdE3/tUxUt4Eny"
  IPFS_PINATA_TOKEN        = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QEiAZcHFaH4cKngkoVrchI5AAAAojCBnwYJKoZIhvcNAQcGoIGRMIGOAgEAMIGIBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDBqHW48Pk0dPZbM/UQIBEIBbXHhOKdZEDHBCM8/vTdtPV6/2x3QbBdxMDYeWaCJ6WMycu3eYORV0HiUIOlzgPyE7oV6iY2sH/lhd4CTCPCvxBEUs8apLtT1gysTYXh3z1ZIWo6AU11SGpbBUMw=="
  OPENSEA_API_KEY          = "AQICAHgxsEqNGHpE95ChWmWb8E5GwzutQVgJ45f5IKhQxJAA5QE4sUynyC2Vh6/I+R++VTwoAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMZ/QcxVRxCkgks/NBAgEQgDvfp094AjLCmQWtdm5Miqc39fLI2xVFwy9TxUQVf/Ewl7OG6IqmUEmTSQiPDG6KXikBUxnFs4zztu6eFA=="
}
