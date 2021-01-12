using Newtonsoft.Json;

namespace Apex.Rider.Models
{
    /*
    {
    "code":0,
    "method":"public/get-ticker",
    "result": {
        "instrument_name":"EGLD_USDT",
        "data": {
            "i":"EGLD_USDT",
            "b":23.8000,
            "k":23.8070,
            "a":23.8257,
            "t":1609276026209,
            "v":41091.592,
            "h":26.2049,
            "l":23.8134,
            "c":-2.2851
            }}}
 */
    public class ExchangeResponse
    {
        public string Code { get; set; }

        public string Method { get; set; }

        [JsonProperty("result")]
        public ExchangeResult ExchangeResult { get; set; }
    }

    public class ExchangeResult 
    {
        [JsonProperty("instrument_name")]
        public string InstrumentName { get; set; }

        [JsonProperty("data")]
        public ExchangeData ExchangeData { get; set; }
    }

    public class ExchangeData 
    {
        [JsonProperty("i")]
        public string InstrumentName { get; set; }

        [JsonProperty("b")]
        public float? BestBidPrice { get; set; }

        [JsonProperty("k")]
        public float? BestAskPrice { get; set; }

        [JsonProperty("a")]
        public float? LatestTradePrice { get; set; }

        [JsonProperty("t")]
        public long TimeStamp { get; set; }

        [JsonProperty("v")]
        public float TradedVolume { get; set; }

        [JsonProperty("h")]
        public float? HighestTradePrice { get; set; }

        [JsonProperty("l")]
        public float? LowestTradePrice { get; set; }

        [JsonProperty("c")]
        public float PriceChange { get; set; }
    }
}
