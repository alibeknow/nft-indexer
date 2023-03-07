package nft_metadata_indexer

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.netty.handler.codec.http.HttpResponseStatus
import scala.concurrent.duration._
import scala.util.Random

class SearchNFTMetadataAPIEndpoint extends Simulation {

  val random = new Random
  val queries = Seq(
    "0x16dB174EC21c6:dolphin",
    "0x3B3ee1931Dc30C195:happy",
    "0x3a921bf2C96Cb60D4:hap",
    "0xabcd:joy",
    "0x7645:lives",
    "0x7645:art",
    "0x7645:Creator",
    "0x7645:improve",
    "0x7645:domain",
    "0x3a921bf2C96Cb60D4:friends"
  )

  val scn = scenario("JSON")
    .exec(
      http("GET")
        .get(session => {
          val query = queries(random.nextInt(queries.length)).split(':')
          s"https://nft-indexer.aws.sbx.ldg-tech.com/api/v0/search/metadata?q=${query(0)}&filter=global&chain=eth&contractAddress=${query(1)}"
        })
        .check(
          status.is(HttpResponseStatus.OK.code())
        )
    )

  setUp(
    scn.inject(
      rampUsersPerSec(1)
        .to(25)
        .during(5.minute),
      constantUsersPerSec(25)
        .during(5.minute)
    )
  )
}
