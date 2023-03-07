package nft_metadata_indexer

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.netty.handler.codec.http.HttpResponseStatus
import scala.concurrent.duration._

class GetContractMetadataAPIEndpoint extends Simulation {
  val scn = scenario("JSON")
    .exec(
      http("GET")
        .get("https://nft-indexer.aws.stg.ldg-tech.com/api/v0/eth/contracts/0xB5a5756708381154D0e0A513E26b990eaa671900")
        .check(
          status.is(HttpResponseStatus.OK.code())
        )
    )

  setUp(
    scn.inject(
      rampUsersPerSec(1)
        .to(7)
        .during(5.minute),
      constantUsersPerSec(7)
        .during(5.minute)
    )
  )
}
