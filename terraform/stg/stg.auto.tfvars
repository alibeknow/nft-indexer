env     = "stg"
profile = "454902641012"

tags = {
  terraform    = "true"
  environment  = "stg"
  owner        = "team-infra-sre@ledger.fr"
  project      = "2129"
  organization = "consumer"
  service      = "nft-indexer-evm"
}

documentdb = {
  cluster_size   = 1
  instance_class = "db.r5.large"
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
  pg_performance_insights_enabled = false
  pg_deletion_protection          = false
}

secrets = {
  NODE_PASSWORD            = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQFPvXrSrTKEY3TS6yyyyeuoAAAAfTB7BgkqhkiG9w0BBwagbjBsAgEAMGcGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM2Abw+yz5sdp6MYI9AgEQgDq+lW8WvVSiopVzxl/pzmMb5kSNJmCB35Uovplhc/kdZWmzk7sIVaE1ie1KNPasm0J6KGRJy54cwyuX"
  PROXY_CREDENTIALS        = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQE+lYNMjUB+31A/JQHeMcgxAAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDDV8V8mwu8ooV28P8QIBEIBwwk8eVVAPE9NOOG4LeowrL05UeNUG9mCWZWZQsU1mtGKmvriwenADCZw3XHaYKTbQcoQoWp86zgvLKrI6ll6yH07xCYvuRkfuKPFXYht0xvIl8kJSQp2jvDPKsi5rl9AOW6uja5qmRgh0x4jVlaBZvA=="
  ETH_NODE_USERNAME        = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQFYOFYM0NuqPsrePwocJCGiAAAAZDBiBgkqhkiG9w0BBwagVTBTAgEAME4GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMHyJ2NtKrmpe4w5LKAgEQgCGHRm9V0B+FZbKMsHqP+HiBmXNfJrxTW1ZZLmCegBOkDTc="
  ETH_NODE_PASSWORD        = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQH+LgKv8DlW+RT5MWU4qb/cAAAAfTB7BgkqhkiG9w0BBwagbjBsAgEAMGcGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMGialcPE2TJttBLSRAgEQgDpiX9EnqigLimFLUm774JZm5VoGpKQRw7NVzpU0YxOs1IidMowq4KaNe57F8p5/jQyxJnN/6q09xBd8"
  MATIC_NODE_USERNAME      = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQFNqqkfB3qDeJqAPOpRX1QQAAAAZTBjBgkqhkiG9w0BBwagVjBUAgEAME8GCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMg4mpUCNjmHXPoSY6AgEQgCLgiGlWi6E+C1+OerrbScd3t4bZouxYbQTIRNrPkefJ3mAy"
  MATIC_NODE_PASSWORD      = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQHmK/0aOpKLevei2ATG98LmAAAAeTB3BgkqhkiG9w0BBwagajBoAgEAMGMGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMIKdHcMh/ey6HIYLvAgEQgDb+/lCXa1uUBtAR1K5NA9L0PCcPi1MRIEGIJeRDfowu7RU7VN3KKFIY9IjtjFXWPWKklR46YzE="
  DATABASE_URL             = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQFg4phayE8c4IS1gPA3B3zTAAAA2DCB1QYJKoZIhvcNAQcGoIHHMIHEAgEAMIG+BgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDHEcNe1cIJ/7HtyVQAIBEICBkFQQfUph7p8jitt635rNGZJJfyhWm2fsBOSw2QxxQb6ZLO21In/BWUR9PMDJro8hwGtVWGYkQaQUDqI0FrGDP/EjX+4Um1N3Yuayzf+DRE74vICc9jEgO6qBwm5FMdVse0rQ+1RU2BIPXd6xUQRtmsHYTR9/srtJbDgTmH5d2yx50nhahlq57yarTkfLiMmRmg=="
  SEARCH_URL               = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQFIvr0H28PoEzfzIPTTtnNBAAAAtzCBtAYJKoZIhvcNAQcGoIGmMIGjAgEAMIGdBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDAWZoFWxFu9uAW0+TgIBEIBwFrM51EfK24BoxW7nbYmTWozWzPGaiucqPK0Ag9tJEXqeXY7584RY2bo9T6AhGiEoEVs6xgByBSr5Bs4dkp8qtcM58JPG2A0weF0KPA/h83MagOj5YLOvvuMMZzrI6X2PI3Z1q5TrCQaVXaB0cdE5AQ=="
  ETH_GOERLI_NODE_USERNAME = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQE1oIWynsKPIQg4jajskJ3XAAAAZzBlBgkqhkiG9w0BBwagWDBWAgEAMFEGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMti0vvY58+k1mOUYhAgEQgCRbqGS7O59JjD5uK3VclxuIS9pCzy+MAthJ37eUU4PY0ic40Bc="
  ETH_GOERLI_NODE_PASSWORD = "AQICAHihbxwvHQ/KnJmR3/DWfgO8azzKObCwjqhPWXXlbHdAUQHM3hHrp3ro3STshYpiPSZcAAAAbjBsBgkqhkiG9w0BBwagXzBdAgEAMFgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMGCkpbACHuKW9e/rEAgEQgCuCQjDMlVI3qJN5+SYw/FNZUrD/T/ESJ5ZQrLZieVEzqtzdE3/tUxUt4Eny"
  IPFS_PINATA_TOKEN        = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQGgwsFAf0MdYMQWH7GrPHbeAAAAojCBnwYJKoZIhvcNAQcGoIGRMIGOAgEAMIGIBgkqhkiG9w0BBwEwHgYJYIZIAWUDBAEuMBEEDIzvQJMxP/rjSW3CMwIBEIBbLpdl/1QT+YNJArPKivYBFU11T4u4qGXHevgaIkTM4nEFdKX6VfZHhc5x6dSDve0rM0FfHqclnGj/W47TPIjluVkeYkgu/BYTrBXq0IsqmP9GqUKtKrDIFJ1N8g=="
  OPENSEA_API_KEY          = "AQICAHhsae32ubcJUfBxRld9Jod8R6krFMPg/QC9FWAZ5xxqOQGuz5gLao5EcY7ebM8egPjZAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMzJBFe+xZZEMEdsWwAgEQgDsfNvupPHcSk1Yt2q10/rppTMpbpijzHJ9NI+aYNQXgeB+JnJTGhoonwqNTX/phmoEplwvsuyjepBGznQ=="
}
