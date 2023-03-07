package nft_metadata_indexer

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.netty.handler.codec.http.HttpResponseStatus
import scala.concurrent.duration._
import scala.util.Random

class GetNFTMetadataAPIEndpointSimulation extends Simulation {

  val random = new Random
  val ids = Seq(
    "0xB5a5756708381154D0e0A513E26b990eaa671900:0x1c25",
    "0x64775Ea96CB4dD8Ef31E3d634af398c66543fbd7:0x1484",
    "0xB716600Ed99B4710152582a124C697A7Fe78ADBF:0x2060",
    "0xB7960ec09EE11ba7606eB881991D6dED46D8c198:0x1ac7",
    "0xB7960ec09EE11ba7606eB881991D6dED46D8c198:0x1b65",
    "0xB61F06Bd84b81f7619e5cBcabc0DCe53199EB7A2:0x07cf",
    "0xB61F06Bd84b81f7619e5cBcabc0DCe53199EB7A2:0x080c",
    "0xd6bae47161BCcFccE97D04e70B98aF99F6DE0bd0:0x0355",
    "0xB61F06Bd84b81f7619e5cBcabc0DCe53199EB7A2:0x0bce",
    "0x9575F8A18E367d90736A074dB5cACa2760811b93:0x011f",
  )

  val scn = scenario("JSON")
    .exec(
      http("GET")
        .get(session => {
          val id = ids(random.nextInt(ids.length)).split(':')
          s"https://nft-indexer.aws.stg.ldg-tech.com/api/v0/eth/metadata/${id(0)}/${id(1)}"
        })
        .check(
          status.is(HttpResponseStatus.OK.code())
        )
    )

  setUp(
    scn.inject(
      rampUsersPerSec(1)
        .to(90)
        .during(5.minute),
      constantUsersPerSec(90)
        .during(5.minute)
    )
  )
}
