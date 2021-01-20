using Apex.Rider.Enums;
using Apex.Rider.Models;
using Apex.Rider.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Diagnostics;
using Serilog;

namespace Apex.Rider.Controllers
{
    [ApiController]
    [Route("api/v2/[controller]")]
    public class CryptoController : ControllerBase
    {
        private readonly Settings _settings;
        private readonly IHttpClient _httpClient;
        private readonly IEmailClient _emailClient;

        private static IDictionary<string, float> mins;
        private static IDictionary<string, float> maxs;

        private static bool isActiveAlert = true;
        private static TimeSpan interval = new TimeSpan(0, 15, 0);
        private static DateTime lastTime;

        private static readonly Stopwatch sw = new();

        static CryptoController()
        {
            mins = new Dictionary<string, float>();
            maxs = new Dictionary<string, float>();
            foreach (var item in Enum.GetValues<Crypto>())
            {
                mins.Add(item.ToString(), 0);
                maxs.Add(item.ToString(), long.MaxValue);
            }
            lastTime = DateTime.Now;
        }

        public CryptoController(IHttpClient httpClient, IEmailClient emailClient, Settings settings)
        {
            _settings = settings;
            _httpClient = httpClient;
            _emailClient = emailClient;
            sw.Start();
        }

        [HttpGet("price/{crypto}")]
        public async Task<ActionResult<ExchangeData>> GetTickerAsync(string crypto)
        {
            var url = $"{_settings.ApiUrl}/v2/public/get-ticker?instrument_name={crypto.ToUpper()}_USDT";
            var result = await _httpClient.GetAsync(url);

            if (result.LatestTradePrice.HasValue)
            {
                //Console.WriteLine(crypto);
                //Log.Debug($"{crypto}: {result.LatestTradePrice.Value}");

                string trend;
                trend = result.LatestTradePrice < mins[crypto] ? "decreased" : "";
                trend = result.LatestTradePrice > maxs[crypto] ? "increased" : "";

                mins[crypto] = result.LatestTradePrice < mins[crypto] ? result.LatestTradePrice.Value : mins[crypto];
                maxs[crypto] = result.LatestTradePrice > maxs[crypto] ? result.LatestTradePrice.Value : maxs[crypto];

                if (maxs[crypto] * (1 - _settings.PriceThreshold / 100F) > mins[crypto] && isActiveAlert)
                {
                    sw.Stop();
                    var opportunity = trend == "increased" ? "Selling" : "Buying";
                    var subject = $"{crypto} price {trend} with more than {_settings.PriceThreshold}% (sent at {DateTime.Now:hh:mm:ss})";
                    var body = $"{opportunity} opportunity!<br />{crypto} with current price {result.LatestTradePrice} {trend} between {mins[crypto]} and {maxs[crypto]} in the last {sw.ElapsedMilliseconds / 1000 / 60} minutes";
                    _emailClient.SendEmail(subject, body);
                    mins[crypto] = long.MaxValue;
                    maxs[crypto] = 0;
                    Log.Information($"Email sent. {crypto}, Min: {mins[crypto]}, Max: {maxs[crypto]}, Price: {result.LatestTradePrice}");

                    isActiveAlert = false;
                    lastTime = DateTime.Now;
                    sw.Restart();
                }

                //if (isActiveAlert)
                //{
                //    switch (result.LatestTradePrice)
                //    {
                //        case < 27:
                //            var subject1 = $"{crypto} price is {result.LatestTradePrice} (sent at {DateTime.Now:hh:mm:ss})";
                //            var body1 = $"{crypto} price is getting lower than {result.LatestTradePrice}";
                //            _emailClient.SendEmail(subject1, body1);
                //            Log.Information($"Email sent. Price: {result.LatestTradePrice}");
                //            isActiveAlert = false;
                //            break;

                //        case > 30:
                //            var subject2 = $"{crypto} price is {result.LatestTradePrice} (sent at {DateTime.Now:hh:mm:ss})";
                //            var body2 = $"{crypto} price is getting higher than {result.LatestTradePrice}";
                //            _emailClient.SendEmail(subject2, body2);
                //            Log.Information($"Email sent. Price: {result.LatestTradePrice}");
                //            isActiveAlert = false;
                //            break;
                //    }
                //}
            }

            if (DateTime.Now.Subtract(lastTime) > interval)
            {
                isActiveAlert = true;
                lastTime = DateTime.Now;
                Log.Debug("Time reset");
            }

            return Ok(result);
        }

        [HttpPost("/some")]
        public async Task<IActionResult> PostSomeAsync()
        {
            //try
            //{
            //    var response = await _httpClient.PostAsync(url, content);
            //    response.EnsureSuccessStatusCode();
            //    var result = await response.Content.ReadAsStringAsync();
            //    return Ok(result);

            //}
            //catch (Exception ex)
            //{
            //    return BadRequest(ex.Message);
            //}

            return Ok();
        }

        private string GetSign(IDictionary<string, object> Params)
        {
            // Join all Params together, combining key with value        
            string RawMessage = string.Join("", Params.Select(entry => $"{entry.Key}{entry.Value}")) + _settings.ApiSecret;

            // Create the 'sign' using SHA256; ensure encoding is in UTF8
            byte[] MessageBytes = Encoding.UTF8.GetBytes(RawMessage);
            byte[] HashMessage = SHA256.Create().ComputeHash(MessageBytes, 0, MessageBytes.Length);
            return String.Concat(Array.ConvertAll(HashMessage, x => x.ToString("x2")));
        }
    }
}
