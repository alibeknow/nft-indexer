package nft_metadata_indexer

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import io.netty.handler.codec.http.HttpResponseStatus
import scala.concurrent.duration._
import scala.util.Random

class GetNFTMetadataBatchAPIEndpoint extends Simulation {

  val random = new Random
  val ids = Seq(
    "0xB5a5756708381154D0e0A513E26b990eaa671900:0x1c25,0x0724,0x0bc3,0x076e,0x0d35,0x0785,0x0c36,0x0ce2,0x0d38",
    "0x2f6098bd3088e280f1c733D1D54188df9c72B6df:0x9b,0x9a",
    "0xC70E249DeD64d1268036b0Fbc3BCd371840938e7:0x05df,0x05e7,0x0537,0x05dd,0x05e3,0x05f8",
    "0xB7960ec09EE11ba7606eB881991D6dED46D8c198:0x1ac7",
    "0xB61F06Bd84b81f7619e5cBcabc0DCe53199EB7A2:0x07cf,0x080c",
    "0x745735600DCf9562060BEcDAE9A1a0AFfFcd9Cf6:0x2122,0x20e1,0x2119,0x20b3,0x2156,0x214f,0x2075,0x2148,0x20cd,0x2145",
    "0xB61F06Bd84b81f7619e5cBcabc0DCe53199EB7A2:0x0bce",
    "0x9575F8A18E367d90736A074dB5cACa2760811b93:0x011f",
    "0x5FDb33f90CcFD59EFD8B75B1BC6D47c32Aae258f:0x0215,0x020a,0x0222",
    "0xA42707DD8e034cE97945e7Cc107Fc593772602Ce:0x1569,0x1583,0x1487,0x1588",
  )

  val scn = scenario("JSON")
    .exec(
      http("GET")
        .get(session => {
          val id = ids(random.nextInt(ids.length)).split(':')
          s"https://nft-indexer.aws.stg.ldg-tech.com/api/v0/eth/metadata/${id(0)}?tokenIds=${id(1)}"
        })
        .check(
          status.is(HttpResponseStatus.OK.code())
        )
    )

  setUp(
    scn.inject(
      rampUsersPerSec(1)
        .to(50)
        .during(5.minute),
      constantUsersPerSec(50)
        .during(5.minute)
    )
  )
}
